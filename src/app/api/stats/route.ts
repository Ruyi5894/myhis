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

// 获取统计数据
export async function GET() {
  try {
    const pool = await getPool();

    // 住院患者总数
    const zyResult = await pool.request().query('SELECT COUNT(*) as count FROM ZY_BRZLXXK');
    
    // 门诊就诊总数
    const mzResult = await pool.request().query('SELECT COUNT(*) as count FROM GH_MXXXK');
    
    // 今日住院
    const today = new Date().toISOString().split('T')[0];
    const todayResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM ZY_BRZLXXK 
      WHERE CONVERT(date, ryrq) = '${today}'
    `);

    // 今日出院
    const todayCyResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM ZY_BRZLXXK 
      WHERE CONVERT(date, cyrq) = '${today}'
    `);

    // 按科室分布 (前10) - ryks 是入院科室代码
    const deptResult = await pool.request().query(`
      SELECT TOP 10 ryks as ksdm, COUNT(*) as count 
      FROM ZY_BRZLXXK 
      GROUP BY ryks 
      ORDER BY count DESC
    `);

    // 按月趋势 (最近12个月)
    const monthResult = await pool.request().query(`
      SELECT TOP 12 
        CONVERT(varchar(7), ryrq, 120) as month,
        COUNT(*) as count
      FROM ZY_BRZLXXK
      WHERE ryrq >= DATEADD(month, -12, GETDATE())
      GROUP BY CONVERT(varchar(7), ryrq, 120)
      ORDER BY month
    `);

    // 诊断分布 (前10)
    const diagResult = await pool.request().query(`
      SELECT TOP 10 
        CASE 
          WHEN LEN(ISNULL(ryzd, '')) > 0 THEN LEFT(ryzd, 20)
          ELSE '未知'
        END as diagnosis,
        COUNT(*) as count
      FROM ZY_BRZLXXK
      WHERE LEN(ISNULL(ryzd, '')) > 0
      GROUP BY LEFT(ryzd, 20)
      ORDER BY count DESC
    `);

    return NextResponse.json({
      success: true,
      data: {
        totalInpatients: zyResult.recordset[0].count,
        totalOutpatients: mzResult.recordset[0].count,
        todayAdmissions: todayResult.recordset[0].count,
        todayDischarges: todayCyResult.recordset[0].count,
        departmentDistribution: deptResult.recordset,
        monthlyTrends: monthResult.recordset,
        diagnosisDistribution: diagResult.recordset,
      },
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: '数据库连接失败' },
      { status: 500 }
    );
  }
}
