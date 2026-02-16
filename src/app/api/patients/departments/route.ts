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

// 获取有病史记录的科室列表
export async function GET() {
  try {
    const pool = await getPool();
    
    // 只返回有病历记录的科室
    const query = `
      SELECT DISTINCT k.Ksdm, k.Ksmc
      FROM JB_KSBMK k
      INNER JOIN GH_MXXXK g ON k.Ksdm = g.Ksdm
      INNER JOIN MZYSZ_YSZDK y ON g.zlh = y.zlh
      WHERE k.Ksdm IS NOT NULL AND k.Ksdm != '' AND k.Ksdm != '1000'
      ORDER BY k.Ksmc
    `;
    
    const result = await pool.request().query(query);
    
    return NextResponse.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: '获取科室列表失败: ' + String(error) },
      { status: 500 }
    );
  }
}
