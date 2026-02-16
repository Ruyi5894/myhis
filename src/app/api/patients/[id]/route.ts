import { NextResponse } from 'next/server';
import sql from 'mssql';

const dbConfig = {
  server: '192.168.1.243',
  database: 'myhis',
  user: 'sa',
  password: 'RfVbGtUjM,Ki',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool: sql.ConnectionPool | null = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

// 获取门诊就诊详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const zlh = parseInt(id, 10);
  
  if (isNaN(zlh)) {
    return NextResponse.json({
      success: false,
      error: '无效的病历号',
    });
  }
  
  try {
    const pool = await getPool();
    
    // 基本信息 - 关联医生表和科室表获取医生和科室姓名
    const basicResult = await pool.request()
      .input('zlh', sql.Int, zlh)
      .query(`
        SELECT TOP 1 
          y.zlh, y.jbxxbh, p.Xm, p.Xb, p.Csny, p.Sfz, p.Dhhm, p.Jtdz, p.Zy,
          CONVERT(VARCHAR(19), y.zdrq, 120) AS zdrq, y.Zdmc, y.Zddm, y.Zs, y.xbs, y.Tj, y.Bz, y.Mb, y.Xt, y.Tw,
          g.Ksdm AS ksdm_code, 
          k.Ksmc AS ksdm,
          y.Zdys, y.Szy,
          doc.zgxm AS doctor_name
        FROM MZYSZ_YSZDK y
        LEFT JOIN XT_BRJBXXK p ON y.jbxxbh = p.Jbxxbh AND y.jbxxbh > 0
        LEFT JOIN YBsjcj_JB_ZGBMK doc ON y.Zdys = doc.zgdm
        LEFT JOIN GH_MXXXK g ON y.zlh = g.zlh
        LEFT JOIN JB_KSBMK k ON g.Ksdm = k.Ksdm
        WHERE y.zlh = @zlh
        ORDER BY y.zdrq DESC
      `);
    
    if (basicResult.recordset.length === 0) {
      return NextResponse.json({
        success: false,
        error: '未找到该就诊记录 (zlh: ' + zlh + ')',
      });
    }

    const basic = basicResult.recordset[0];
    
    // 处方列表
    const prescriptionQuery = `
      SELECT 
        CFxh AS cfxh,
        brkh,
        cfysdm,
        cfje,
        cflx,
        CONVERT(VARCHAR(19), cfrq, 120) AS cfrq,
        cfysksdm,
        cfzxksdm,
        sycfbz
      FROM MZYSZ_CFK
      WHERE brzlh = ${zlh}
      ORDER BY cfrq DESC
    `;
    const prescriptionResult = await pool.request().query(prescriptionQuery);

    // 处方明细
    const prescriptionDetailQuery = `
      SELECT 
        m.cfxh,
        m.cfmxxh,
        m.cfxmdm,
        CAST(x.Mzgg AS NVARCHAR(MAX)) AS Mzgg,
        m.Jl,
        m.sl,
        m.ypyf,
        m.ypsypldm,
        m.ypyl,
        ISNULL(m.cfxmmc, x.Mxxmmc) AS cfxmmc
      FROM MZYSZ_CFMXK m
      INNER JOIN JB_SFXMMXK x ON RTRIM(m.cfxmdm) = RTRIM(x.Mxxmdm)
      WHERE m.cfxh IN (SELECT CFxh FROM MZYSZ_CFK WHERE brzlh = ${zlh})
      ORDER BY m.cfmxxh DESC
    `;
    const prescriptionDetailResult = await pool.request().query(prescriptionDetailQuery);

    // 费用汇总
    const feeSummaryQuery = `
      SELECT 
        COUNT(*) AS cf_count,
        ISNULL(SUM(cfje), 0) AS total_cfje,
        ISNULL(SUM(g.Ghf), 0) AS total_ghf
      FROM MZYSZ_CFK c
      LEFT JOIN GH_MXXXK g ON c.brzlh = g.zlh
      WHERE c.brzlh = ${zlh}
    `;
    const feeSummaryResult = await pool.request().query(feeSummaryQuery);
    
    // 计算年龄
    let age = '-';
    if (basic.Csny) {
      const birthDate = new Date(basic.Csny);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toString();
      }
    }

    const feeSummary = feeSummaryResult.recordset[0];

    return NextResponse.json({
      success: true,
      data: {
        basicInfo: {
          name: basic.Xm?.trim() || '未知',
          gender: basic.Xb === 1 ? '女' : (basic.Xb === 0 ? '男' : '未知'),
          age: age + '岁',
          cardNo: basic.Sfz?.trim() || '-',
          phone: basic.Dhhm?.trim() || '-',
          address: basic.Jtdz?.trim() || '-',
          occupation: basic.Zy?.trim() || '-',
          visitDate: basic.zdrq,
          dept: basic.ksdm || '-',
        },
        medicalRecord: {
          chiefComplaint: basic.Zs?.trim() || (basic.xbs?.trim()?.split('。')[0] + '。' || '-'),
          presentIllness: basic.xbs?.trim() || '-',
          pastHistory: '-',
          physicalExam: basic.Tj?.trim() || '-',
          preliminaryDiagnosis: basic.Zdmc?.trim() || '-',
          diagnosisCode: basic.Zddm?.trim() || '-',
          treatment: basic.Bz?.trim() || '-',
        },
        vitalSigns: {
          bloodPressure: basic.Xt || '-',
          heartRate: basic.Mb?.toString() || '-',
          temperature: basic.Tw ? basic.Tw + '°C' : '-',
        },
        signature: {
          doctor: `${basic.doctor_name || '-'} (${basic.Zdys || '-'})`,
          signDate: basic.zdrq,
        },
        prescriptions: prescriptionResult.recordset,
        prescriptionDetails: prescriptionDetailResult.recordset,
        feeSummary: {
          cfCount: feeSummary.cf_count || 0,
          totalCfje: feeSummary.total_cfje || 0,
          totalGhf: feeSummary.total_ghf || 0,
        },
      },
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: '数据库连接失败: ' + String(error) },
      { status: 500 }
    );
  }
}
