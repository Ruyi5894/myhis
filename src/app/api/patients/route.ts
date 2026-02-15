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

// 获取门诊就诊列表 - 按zlh去重，显示诊断名称
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
      dateCondition = ` AND zdrq >= '${startDate} 00:00:00' AND zdrq <= '${endDate} 23:59:59'`;
    } else if (startDate) {
      dateCondition = ` AND zdrq >= '${startDate} 00:00:00'`;
    } else if (endDate) {
      dateCondition = ` AND zdrq <= '${endDate} 23:59:59'`;
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

    // 按zlh去重，获取主要诊断名称
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
            STRING_AGG(CONVERT(VARCHAR(500), ISNULL(d.zdmc, '')), '; ') AS ryzd,
            STRING_AGG(CONVERT(VARCHAR(200), ISNULL(y.Zddm, '')), '; ') AS zddm,
            MAX(CONVERT(VARCHAR(500), y.xbs)) AS zhushu,
            MAX(ssy) AS ssy,
            MAX(szy) AS szy
          FROM MZYSZ_YSZDK y
          LEFT JOIN JB_ZDDMK d ON RTRIM(y.Zddm) = RTRIM(d.zddm)
          WHERE 1=1 ${dateCondition}
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
      WHERE 1=1 ${dateCondition}
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
