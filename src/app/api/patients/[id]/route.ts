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

// 获取患者详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const pool = await getPool();
    
    // 住院详情
    if (id.startsWith('ZY') || !isNaN(Number(id))) {
      const zyQuery = `
        SELECT TOP 1 
          zlh, jbxxbh, kh, knxx, zyh, xm, xb, csny, sfz, pzh,
          ztqkdm, zhbz, jzlx, tsrybz, brlx,
          ryrq, ryfs, ryzd, ryks, rybq, ryqk,
          cyrq, cyfs, klb, czy, djzt, Dqbz, Zycs, YBJFLX, XZQ, sbryzd, Cxrq,
          '住院' AS jzlx_text,
          CASE WHEN cyrq IS NULL THEN '在院' ELSE '已出院' END AS status,
          DATEDIFF(DAY, ryrq, ISNULL(cyrq, GETDATE())) AS days
        FROM ZY_BRZLXXK
        WHERE zlh = ${id} OR zyh = '${id}'
      `;
      
      const zyResult = await pool.request().query(zyQuery);
      
      if (zyResult.recordset.length > 0) {
        const patient = zyResult.recordset[0];
        
        const fyQuery = `
          SELECT TOP 20 
            Fph, Jsxh, Jssj, Zje, Xjzje, Jzje, Flzfje
          FROM ZY_FPXXK
          WHERE zlh = ${id}
          ORDER BY Jssj DESC
        `;
        const fyResult = await pool.request().query(fyQuery);
        
        return NextResponse.json({
          success: true,
          data: {
            type: 'inpatient',
            basic: patient,
            fees: fyResult.recordset,
            medicalRecords: [],
          },
        });
      }
    }
    
    // 门诊详情 - 使用 MZYSZ_YSZDK
    const mzQuery = `
      SELECT TOP 1 
        y.zlh, y.jbxxbh, b.xm, b.xb, b.csny, b.sfz, b.lxdh, b.dz,
        y.zdrq AS ryrq, y.Zdmc AS ryzd, y.Zddm AS zddm, y.xbs AS zhushu,
        y.Ssy AS ryks, y.Szy AS szy, y.Jlzt AS djzt,
        '门诊' AS jzlx_text,
        '已完成' AS status
      FROM MZYSZ_YSZDK y
      LEFT JOIN BC_BRXXK b ON y.jbxxbh = b.jbxxbh
      WHERE y.zlh = ${id}
      ORDER BY y.zdrq DESC
    `;
    
    const mzResult = await pool.request().query(mzQuery);
    
    if (mzResult.recordset.length > 0) {
      // 获取该患者的所有门诊记录
      const allRecordsQuery = `
        SELECT TOP 50
          y.zdrq AS ryrq, y.Zdmc AS ryzd, y.Zddm AS zddm, y.xbs AS zhushu,
          y.Ssy AS ryks, y.Szy AS szy
        FROM MZYSZ_YSZDK y
        WHERE y.zlh = ${id}
        ORDER BY y.zdrq DESC
      `;
      const allRecords = await pool.request().query(allRecordsQuery);
      
      // 获取费用信息
      const fyQuery = `
        SELECT TOP 20 
          Fph, Jsxh, Jssj, Zje, Xjzje, Jzje, Flzfje
        FROM GH_MXXXK
        WHERE zlh = ${id}
        ORDER BY Ghrq DESC
      `;
      const fyResult = await pool.request().query(fyQuery);
      
      return NextResponse.json({
        success: true,
        data: {
          type: 'outpatient',
          basic: mzResult.recordset[0],
          fees: fyResult.recordset,
          medicalRecords: allRecords.recordset,
        },
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '未找到该患者记录',
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: '数据库连接失败: ' + String(error) },
      { status: 500 }
    );
  }
}
