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

// 获取科室列表
export async function GET() {
  try {
    const pool = await getPool();
    
    const query = `
      SELECT Ksdm, Ksmc 
      FROM JB_KSBMK 
      WHERE Ksdm IS NOT NULL AND Ksdm != ''
      ORDER BY Ksdm
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
