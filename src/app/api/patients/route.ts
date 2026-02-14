import { NextResponse } from 'next/server';
import sql from 'mssql';

// 数据库配置
const dbConfig = {
  server: '192.168.1.243',
  database: 'myhis',
  user: 'sa',
  password: 'RfVbGtUjM,Ki',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

// 获取患者列表
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const keyword = searchParams.get('keyword') || '';
  const type = searchParams.get('type') || 'all'; // all, inpatient, outpatient

  try {
    const pool = await getPool();
    
    let whereClause = '';
    if (keyword) {
      whereClause = `WHERE (xm LIKE '%${keyword}%' OR kh LIKE '%${keyword}%' OR zyh LIKE '%${keyword}%' OR sfz LIKE '%${keyword}%')`;
    }

    // 获取住院患者
    let zyQuery = `
      SELECT TOP ${pageSize} zlh, jbxxbh, kh, knxx, zyh, xm, xb, csny, sfz, pzh, 
             ryrq, cyrq, ryzd, ryks, rybq, djzt, '住院' AS jzlx
      FROM ZY_BRZLXXK
      ${whereClause}
      ORDER BY ryrq DESC
      OFFSET ${(page - 1) * pageSize} ROWS
    `;

    // 获取门诊患者
    let mzQuery = `
      SELECT TOP ${pageSize} g.zlh, g.jbxxbh, g.kh, '' AS knxx, '' AS zyh, 
             p.xm, p.xb, p.csny, p.sfz, '' AS pzh,
             g.ghrq AS ryrq, NULL AS cyrq, '' AS ryzd, g.ksdm AS ryks, 0 AS rybq, g.jlzt AS djzt, '门诊' AS jzlx
      FROM GH_MXXXK g
      LEFT JOIN JB_JKDAJZSK p ON g.jbxxbh = p.jbxxbh
      WHERE p.xm LIKE '%${keyword}%' OR g.kh LIKE '%${keyword}%'
      ORDER BY g.ghrq DESC
      OFFSET ${(page - 1) * pageSize} ROWS
    `;

    let result;
    if (type === 'inpatient') {
      result = await pool.request().query(zyQuery);
    } else if (type === 'outpatient') {
      result = await pool.request().query(mzQuery);
    } else {
      // 合并查询
      result = await pool.request().query(zyQuery);
    }

    // 获取总数
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM ZY_BRZLXXK ${whereClause}
    `);

    return NextResponse.json({
      success: true,
      data: result.recordset,
      total: countResult.recordset[0].total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: '数据库连接失败' },
      { status: 500 }
    );
  }
}
