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

// 获取门诊就诊列表
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');
  const keyword = searchParams.get('keyword') || '';
  
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const patientType = searchParams.get('type') || 'all';

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
      keywordCondition = ` AND (b.xm LIKE '%${keyword}%' OR y.Zdmc LIKE '%${keyword}%' OR y.xbs LIKE '%${keyword}%' OR y.zlh = '${keyword}')`;
    }

    // 门诊就诊查询 - 关联 MZYSZ_YSZDK (病史) + GH_MXXXK (挂号) + BC_BRXXK (患者档案)
    const mzQuery = `
      SELECT * FROM (
        SELECT 
          ROW_NUMBER() OVER (ORDER BY y.zdrq DESC) AS RowNum,
          y.zlh AS zlh,                         -- 挂号ID
          y.jbxxbh AS jbxxbh,                  -- 档案ID
          ISNULL(b.xm, '未知') AS xm,          -- 姓名
          ISNULL(b.xb, 0) AS xb,               -- 性别
          b.csny,                              -- 出生年月
          b.sfz,                               -- 身份证
          b.lxdh,                              -- 电话
          b.dz,                                -- 地址
          y.zdrq AS ryrq,                      -- 就诊日期
          y.Zdmc AS ryzd,                      -- 诊断名称
          y.Zddm AS zddm,                      -- 诊断代码
          y.xbs AS zhushu,                      -- 主诉/现病史
          y.Szy AS szy,                        -- 医生
          y.Ssy AS ssy,                        -- 科室
          g.Fymc AS fymc,                      -- 挂号费项目
          g.Ghf AS ghf,                        -- 挂号费
          '门诊' AS jzlx,
          '已完成' AS status,
          y.Jlzt AS jlzt
        FROM MZYSZ_YSZDK y
        LEFT JOIN GH_MXXXK g ON y.zlh = g.zlh
        LEFT JOIN BC_BRXXK b ON y.jbxxbh = b.jbxxbh AND y.jbxxbh > 0
        WHERE 1=1 ${dateCondition} ${keywordCondition}
      ) AS MZPage
      WHERE RowNum BETWEEN ${offset + 1} AND ${offset + pageSize}
    `;
    
    const mzResult = await pool.request().query(mzQuery);
    
    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as cnt 
      FROM MZYSZ_YSZDK y
      LEFT JOIN BC_BRXXK b ON y.jbxxbh = b.jbxxbh AND y.jbxxbh > 0
      WHERE 1=1 ${dateCondition} ${keywordCondition}
    `;
    const countResult = await pool.request().query(countQuery);
    const total = countResult.recordset[0].cnt;

    return NextResponse.json({
      success: true,
      data: mzResult.recordset,
      total: total,
      stats: {
        outpatient: total,
      },
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
