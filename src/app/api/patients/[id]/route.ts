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

// 获取门诊就诊详情 - 包含费用明细和处方信息
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const pool = await getPool();
    
    // 基本信息
    const basicQuery = `
      SELECT TOP 1 
        y.zlh,
        y.jbxxbh,
        ISNULL(p.Xm, '未知') AS xm,
        CASE ISNULL(p.Xb, 0) WHEN 0 THEN '女' WHEN 1 THEN '男' ELSE '未知' END AS xb_text,
        p.Csny AS csny,
        p.Sfz AS sfz,
        p.Dhhm AS lxdh,
        p.Jtdz AS dz,
        y.zdrq AS ryrq,
        y.Zdmc AS ryzd,
        y.Zddm AS zddm,
        y.xbs AS zhushu,
        y.Szy AS szy,
        y.Ssy AS ssy,
        g.Fymc AS fymc,
        g.Ghf AS ghf
      FROM MZYSZ_YSZDK y
      LEFT JOIN GH_MXXXK g ON y.zlh = g.zlh
      LEFT JOIN XT_BRJBXXK p ON y.jbxxbh = p.Jbxxbh AND y.jbxxbh > 0
      WHERE y.zlh = ${id}
      ORDER BY y.zdrq DESC
    `;
    
    const basicResult = await pool.request().query(basicQuery);
    
    if (basicResult.recordset.length === 0) {
      return NextResponse.json({
        success: false,
        error: '未找到该就诊记录',
      });
    }

    // 处方列表
    const prescriptionQuery = `
      SELECT 
        CFxh AS cfxh,
        brkh,
        cfysdm,
        cfje,
        cflx,
        cfrq,
        cfysksdm,
        cfzxksdm,
        sycfbz
      FROM MZYSZ_CFK
      WHERE brzlh = ${id}
      ORDER BY cfrq DESC
    `;
    const prescriptionResult = await pool.request().query(prescriptionQuery);

    // 处方明细（药品/治疗项目）- 从JB_SFXMMXK获取完整规格
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
      WHERE m.cfxh IN (SELECT CFxh FROM MZYSZ_CFK WHERE brzlh = ${id})
      ORDER BY m.cfmxxh DESC
    `;
    const prescriptionDetailResult = await pool.request().query(prescriptionDetailQuery);

    // 汇总费用
    const feeSummaryQuery = `
      SELECT 
        COUNT(*) AS cf_count,
        ISNULL(SUM(cfje), 0) AS total_cfje,
        ISNULL(SUM(g.Ghf), 0) AS total_ghf
      FROM MZYSZ_CFK c
      LEFT JOIN GH_MXXXK g ON c.brzlh = g.zlh
      WHERE c.brzlh = ${id}
    `;
    const feeSummaryResult = await pool.request().query(feeSummaryQuery);

    return NextResponse.json({
      success: true,
      data: {
        basic: basicResult.recordset[0],
        prescriptions: prescriptionResult.recordset,
        prescriptionDetails: prescriptionDetailResult.recordset,
        feeSummary: feeSummaryResult.recordset[0],
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
