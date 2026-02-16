import { NextResponse } from 'next/server';
import sql from 'mssql';

const config = {
  server: '192.168.1.243',
  database: 'myhis',
  user: 'sa',
  password: 'RfVbGtUjM,Ki',
  options: { encrypt: false, trustServerCertificate: true }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

  let pool: sql.ConnectionPool | null = null;
  
  try {
    pool = await sql.connect(config);
    
    // 1. 总体费用统计 - 简化查询
    const totalResult = await pool.request().query(`
      SELECT 
        (SELECT COUNT(DISTINCT zlh) FROM MZYSZ_YSZDK WHERE zdrq >= '${startDate}' AND zdrq <= '${endDate} 23:59:59') as visit_count,
        (SELECT COUNT(*) FROM MZYSZ_CFK WHERE cfrq >= '${startDate}' AND cfrq <= '${endDate} 23:59:59') as prescription_count,
        (SELECT ISNULL(SUM(CAST(cfje AS DECIMAL(18,2))), 0) FROM MZYSZ_CFK WHERE cfrq >= '${startDate}' AND cfrq <= '${endDate} 23:59:59') as total_fee,
        (SELECT ISNULL(AVG(CAST(cfje AS DECIMAL(18,2))), 0) FROM MZYSZ_CFK WHERE cfrq >= '${startDate}' AND cfrq <= '${endDate} 23:59:59') as avg_fee
    `);

    // 2. 科室费用排名
    const deptResult = await pool.request().query(`
      SELECT TOP 15
        k.Ksdm,
        k.Ksmc,
        COUNT(DISTINCT y.zlh) as visit_count,
        ISNULL(SUM(CAST(cf.cfje AS DECIMAL(18,2))), 0) as total_fee,
        ISNULL(AVG(CAST(cf.cfje AS DECIMAL(18,2))), 0) as avg_fee
      FROM MZYSZ_YSZDK y
      LEFT JOIN GH_MXXXK g ON y.zlh = g.zlh
      LEFT JOIN JB_KSBMK k ON g.Ksdm = k.Ksdm
      LEFT JOIN MZYSZ_CFK cf ON cf.brzlh = y.zlh
      WHERE y.zdrq >= '${startDate}' AND y.zdrq <= '${endDate} 23:59:59'
      GROUP BY k.Ksdm, k.Ksmc
      HAVING COUNT(DISTINCT y.zlh) > 0
      ORDER BY total_fee DESC
    `);

    // 3. 医生费用排名
    const doctorResult = await pool.request().query(`
      SELECT TOP 20
        doc.zgdm,
        doc.zgxm,
        COUNT(DISTINCT y.zlh) as visit_count,
        ISNULL(SUM(CAST(cf.cfje AS DECIMAL(18,2))), 0) as total_fee,
        ISNULL(AVG(CAST(cf.cfje AS DECIMAL(18,2))), 0) as avg_fee
      FROM MZYSZ_YSZDK y
      LEFT JOIN YBsjcj_JB_ZGBMK doc ON y.Zdys = doc.zgdm
      LEFT JOIN MZYSZ_CFK cf ON cf.brzlh = y.zlh
      WHERE y.zdrq >= '${startDate}' AND y.zdrq <= '${endDate} 23:59:59'
      GROUP BY doc.zgdm, doc.zgxm
      HAVING COUNT(DISTINCT y.zlh) > 0
      ORDER BY total_fee DESC
    `);

    // 4. 大处方预警
    const bigRxResult = await pool.request().query(`
      SELECT TOP 20
        cf.CFxh,
        CAST(cf.cfje AS DECIMAL(18,2)) as cfje,
        CONVERT(VARCHAR(10), cf.cfrq, 120) as cfrq,
        p.Xm as patient_name,
        doc.zgxm as doctor_name
      FROM MZYSZ_CFK cf
      LEFT JOIN MZYSZ_YSZDK y ON cf.brzlh = y.zlh
      LEFT JOIN XT_BRJBXXK p ON y.jbxxbh = p.Jbxxbh
      LEFT JOIN YBsjcj_JB_ZGBMK doc ON cf.cfysdm = doc.zgdm
      WHERE cf.cfje >= 500
      AND cf.cfrq >= '${startDate}' AND cf.cfrq <= '${endDate} 23:59:59'
      ORDER BY cf.cfje DESC
    `);

    // 5. 费用分布
    const distResult = await pool.request().query(`
      SELECT 
        CASE 
          WHEN CAST(cfje AS DECIMAL(18,2)) < 100 THEN '0-100元'
          WHEN CAST(cfje AS DECIMAL(18,2)) < 300 THEN '100-300元'
          WHEN CAST(cfje AS DECIMAL(18,2)) < 500 THEN '300-500元'
          ELSE '500元以上'
        END as fee_range,
        COUNT(*) as count,
        ISNULL(SUM(CAST(cfje AS DECIMAL(18,2))), 0) as total
      FROM MZYSZ_CFK
      WHERE cfrq >= '${startDate}' AND cfrq <= '${endDate} 23:59:59'
      GROUP BY 
        CASE 
          WHEN CAST(cfje AS DECIMAL(18,2)) < 100 THEN '0-100元'
          WHEN CAST(cfje AS DECIMAL(18,2)) < 300 THEN '100-300元'
          WHEN CAST(cfje AS DECIMAL(18,2)) < 500 THEN '300-500元'
          ELSE '500元以上'
        END
    `);

    const total = totalResult.recordset[0];
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          visitCount: total.visit_count || 0,
          prescriptionCount: total.prescription_count || 0,
          totalFee: parseFloat(String(total.total_fee || 0)),
          avgPrescriptionFee: parseFloat(String(total.avg_fee || 0)),
          bigPrescriptionCount: bigRxResult.recordset.length,
          dateRange: { startDate, endDate }
        },
        departmentRanking: deptResult.recordset.map((d: any) => ({
          deptCode: d.Ksdm,
          deptName: d.Ksmc?.trim() || '未知',
          visitCount: d.visit_count,
          totalFee: parseFloat(String(d.total_fee || 0)),
          avgFee: parseFloat(String(d.avg_fee || 0))
        })),
        doctorRanking: doctorResult.recordset.map((d: any) => ({
          doctorCode: d.zgdm,
          doctorName: d.zgxm?.trim() || '未知',
          visitCount: d.visit_count,
          totalFee: parseFloat(String(d.total_fee || 0)),
          avgFee: parseFloat(String(d.avg_fee || 0))
        })),
        bigPrescriptions: bigRxResult.recordset.map((b: any) => ({
          prescriptionId: b.CFxh,
          fee: parseFloat(String(b.cfje || 0)),
          date: b.cfrq,
          patientName: b.patient_name?.trim() || '-',
          doctorName: b.doctor_name?.trim() || '-'
        })),
        feeDistribution: distResult.recordset.map((f: any) => ({
          range: f.fee_range,
          count: f.count,
          total: parseFloat(String(f.total || 0))
        }))
      }
    });

  } catch (error) {
    console.error('Fee analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '费用分析失败: ' + (error instanceof Error ? error.message : String(error))
    });
  }
}
