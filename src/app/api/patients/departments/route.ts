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
    
    // 从病历表直接获取有记录的科室代码
    const query = `
      SELECT DISTINCT y.ssy AS Ksdm, k.Ksmc
      FROM MZYSZ_YSZDK y
      LEFT JOIN JB_KSBMK k ON y.ssy = k.Ksdm
      WHERE y.ssy IS NOT NULL AND y.ssy != '' AND y.ssy != '1000'
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
