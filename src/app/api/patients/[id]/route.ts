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
  
  try {
    const pool = await getPool();
    
    // 门诊详情 - 使用 MZYSZ_YSZDK (病史) + GH_MXXXK (挂号) + BC_BRXXK (患者档案)
    const mzQuery = `
      SELECT TOP 1 
        y.zlh AS zlh,
        y.jbxxbh AS jbxxbh,
        ISNULL(b.xm, '未知') AS xm,
        ISNULL(b.xb, 0) AS xb,
        b.csny,
        b.sfz,
        b.lxdh,
        b.dz,
        y.zdrq AS ryrq,
        y.Zdmc AS ryzd,
        y.Zddm AS zddm,
        y.xbs AS zhushu,
        y.Szy AS szy,
        y.Ssy AS ssy,
        g.Fymc,
        g.Ghf,
        y.Jlzt,
        '门诊' AS jzlx_text,
        '已完成' AS status
      FROM MZYSZ_YSZDK y
      LEFT JOIN GH_MXXXK g ON y.zlh = g.zlh
      LEFT JOIN BC_BRXXK b ON y.jbxxbh = b.jbxxbh AND y.jbxxbh > 0
      WHERE y.zlh = ${id}
      ORDER BY y.zdrq DESC
    `;
    
    const mzResult = await pool.request().query(mzQuery);
    
    if (mzResult.recordset.length > 0) {
      // 获取该患者的所有就诊记录
      const allRecordsQuery = `
        SELECT TOP 100
          y.zdrq AS ryrq,
          y.Zdmc AS ryzd,
          y.Zddm AS zddm,
          y.xbs AS zhushu,
          y.Szy AS szy,
          y.Ssy AS ssy,
          g.Fymc,
          g.Ghf
        FROM MZYSZ_YSZDK y
        LEFT JOIN GH_MXXXK g ON y.zlh = g.zlh
        WHERE y.zlh = ${id}
        ORDER BY y.zdrq DESC
      `;
      const allRecords = await pool.request().query(allRecordsQuery);
      
      return NextResponse.json({
        success: true,
        data: {
          type: 'outpatient',
          basic: mzResult.recordset[0],
          medicalRecords: allRecords.recordset,
          fees: [],
        },
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '未找到该就诊记录',
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: '数据库连接失败: ' + String(error) },
      { status: 500 }
    );
  }
}
