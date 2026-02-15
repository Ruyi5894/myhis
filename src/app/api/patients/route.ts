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

// 获取门诊就诊列表 - 按zlh去重，显示基本信息+费用
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
      dateCondition = ` AND y.zdrq >= '${startDate} 00:00:00' AND y.zdrq <= '${endDate} 23:59:59'`;
    } else if (startDate) {
      dateCondition = ` AND y.zdrq >= '${startDate} 00:00:00'`;
    } else if (endDate) {
      dateCondition = ` AND y.zdrq <= '${endDate} 23:59:59'`;
    }
    
    let keywordCondition = '';
    if (keyword) {
      keywordCondition = ` AND (
        p.Xm LIKE '%${keyword}%' OR 
        y.Zdmc LIKE '%${keyword}%' OR 
        y.xbs LIKE '%${keyword}%' OR 
        y.zlh = '${keyword}' OR 
        p.Kh LIKE '%${keyword}%' OR 
        p.Sfz LIKE '%${keyword}%'
      )`;
    }

    // 门诊就诊查询 - 按zlh去重
    const mzQuery = `
      SELECT * FROM (
        SELECT 
          ROW_NUMBER() OVER (ORDER BY y.zdrq DESC) AS RowNum,
          y.zlh,                         -- 挂号ID (唯一)
          y.jbxxbh,                      -- 档案ID
          ISNULL(p.Xm, '未知') AS xm,   -- 姓名
          CASE ISNULL(p.Xb, 0) WHEN 0 THEN '女' WHEN 1 THEN '男' ELSE '未知' END AS xb_text,
          p.Csny AS csny,                -- 出生年月
          p.Sfz AS sfz,                  -- 身份证
          p.Dhhm AS lxdh,               -- 电话
          p.Jtdz AS dz,                  -- 地址
          y.zdrq AS ryrq,                -- 就诊日期
          y.Zdmc AS ryzd,                -- 诊断名称
          y.Zddm AS zddm,                -- 诊断代码
          y.xbs AS zhushu,               -- 主诉/现病史
          y.Szy AS szy,                  -- 医生编码
          y.Ssy AS ssy,                  -- 科室编码
          g.Fymc AS fymc,                -- 挂号费项目
          g.Ghf AS ghf,                  -- 挂号费
          (SELECT ISNULL(SUM(cfje), 0) FROM MZYSZ_CFK WHERE brzlh = y.zlh) AS cfje, -- 处方金额
          (SELECT COUNT(*) FROM MZYSZ_CFK WHERE brzlh = y.zlh) AS cf_count,        -- 处方数量
          (SELECT COUNT(*) FROM MZYSZ_CFMXK WHERE cfxh IN (SELECT CFxh FROM MZYSZ_CFK WHERE brzlh = y.zlh)) AS yp_count, -- 药品数量
          '门诊' AS jzlx,
          '已完成' AS status
        FROM MZYSZ_YSZDK y
        LEFT JOIN GH_MXXXK g ON y.zlh = g.zlh
        LEFT JOIN XT_BRJBXXK p ON y.jbxxbh = p.Jbxxbh AND y.jbxxbh > 0
        WHERE 1=1 ${dateCondition} ${keywordCondition}
      ) AS MZPage
      WHERE RowNum BETWEEN ${offset + 1} AND ${offset + pageSize}
    `;
    
    const mzResult = await pool.request().query(mzQuery);
    
    // 获取去重后的总数
    const countQuery = `
      SELECT COUNT(DISTINCT y.zlh) as cnt 
      FROM MZYSZ_YSZDK y
      LEFT JOIN XT_BRJBXXK p ON y.jbxxbh = p.Jbxxbh AND y.jbxxbh > 0
      WHERE 1=1 ${dateCondition} ${keywordCondition}
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
