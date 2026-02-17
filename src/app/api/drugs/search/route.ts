import { NextResponse } from 'next/server';
import sql from 'mssql';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || '';
  
  try {
    const pool = await sql.connect({
      server: '192.168.1.243',
      database: 'myhis',
      user: 'sa',
      password: 'RfVbGtUjM,Ki',
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    });
    
    // 查询项目明细表（药典）- 先查看表结构
    const query = `
      SELECT TOP 5 
        Mxxmdm as code,
        Mxxmmc as name,
        Mzgg as spec,
        Jl as dosePerUnit
      FROM JB_SFXMMXK 
      WHERE Mxxmmc LIKE N'%${name}%'
    `;
    
    const result = await pool.request().query(query);
    await pool.close();
    
    return NextResponse.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}
