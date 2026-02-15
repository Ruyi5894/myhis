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

// 获取门诊就诊列表 - 按zlh去重，合并诊断信息
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');
  const keyword = searchParams.get('keyword') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  try {
    const pool = await getPool();
    const offset = (page - 1) * pageSize;
    
    let dateCondition = '';
    if (startDate && endDate) {
      dateCondition = ` WHERE zdrq >= '${startDate} 00:00:00' AND zdrq <= '${endDate} 23:59:59'`;
    } else if (startDate) {
      dateCondition = ` WHERE zdrq >= '${startDate} 00:00:00'`;
    } else if (endDate) {
      dateCondition = ` WHERE zdrq <= '${endDate} 23:59:59'`;
    }
    
    let keywordCondition = '';
    if (keyword) {
      keywordCondition = ` AND (
        p.Xm LIKE '%${keyword}%' OR 
        p.Sfz LIKE '%${keyword}%' OR 
        zd.ryzd LIKE '%${keyword}%' OR 
        zd.zhushu LIKE '%${keyword}%' OR 
        zd.zlh = '${keyword}'
      )`;
    }

    // 使用 CTE 按 zlh 去重，合并诊断信息
    const mzQuery = `
      SELECT * FROM (
        SELECT 
          ROW_NUMBER() OVER (ORDER BY zd.zdrq DESC) AS RowNum,
          zd.zlh,
          zd.jbxxbh,
          ISNULL(p.Xm, '未知') AS xm,
          CASE ISNULL(p.Xb, 0) WHEN 0 THEN '女' WHEN 1 THEN '男' ELSE '未知' END AS xb_text,
          p.Csny AS csny,
          p.Sfz AS sfz,
          p.Dhhm AS lxdh,
          p.Jtdz AS dz,
          zd.zdrq AS ryrq,
          zd.ryzd,
          zd.zddm,
          zd.zhushu,
          zd.ssy,
          zd.szy,
          g.Fymc AS fymc,
          g.Ghf AS ghf,
          (SELECT ISNULL(SUM(cfje), 0) FROM MZYSZ_CFK WHERE brzlh = zd.zlh) AS cfje,
          (SELECT COUNT(*) FROM MZYSZ_CFK WHERE brzlh = zd.zlh) AS cf_count,
          (SELECT COUNT(*) FROM MZYSZ_CFMXK WHERE cfxh IN (SELECT CFxh FROM MZYSZ_CFK WHERE brzlh = zd.zlh)) AS yp_count,
          '已完成' AS status
        FROM (
          SELECT 
            zlh,
            MAX(zdrq) AS zdrq,
            MAX(jbxxbh) AS jbxxbh,
            STRING_AGG(CONVERT(VARCHAR(500), ISNULL(Zdmc, '')), '; ') AS ryzd,
            STRING_AGG(CONVERT(VARCHAR(100), ISNULL(Zddm, '')), '; ') AS zddm,
            STRING_AGG(CONVERT(VARCHAR(2000), ISNULL(xbs, '')), '; ') AS zhushu,
            MAX(ssy) AS ssy,
            MAX(szy) AS szy
          FROM MZYSZ_YSZDK
          ${dateCondition}
          GROUP BY zlh
        ) zd
        LEFT JOIN GH_MXXXK g ON zd.zlh = g.zlh
        LEFT JOIN XT_BRJBXXK p ON zd.jbxxbh = p.Jbxxbh AND zd.jbxxbh > 0
        WHERE 1=1 ${keywordCondition}
      ) AS MZPage
      WHERE RowNum BETWEEN ${offset + 1} AND ${offset + pageSize}
    `;
    
    const mzResult = await pool.request().query(mzQuery);
    
    // 获取总数
    const countQuery = `
      SELECT COUNT(DISTINCT zlh) as cnt 
      FROM MZYSZ_YSZDK
      ${dateCondition} ${keywordCondition.replace(/zd\./g, '')}
    `;
    const countResult = await pool.request().query(countQuery);
    const total = countResult.recordset[0].cnt;

    return NextResponse.json({
      success: true,
      data: mzResult.recordset,
      total: total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: '数据库连接失败: ' + String(error) },
      { status: 500 }
    );
  }
}
