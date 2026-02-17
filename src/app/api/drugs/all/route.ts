import { NextResponse } from 'next/server';
import sql from 'mssql';

export async function GET(request: Request) {
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
    
    // 查询所有药品（按名称排序）
    const query = `
      SELECT 
        Mxxmdm as code,
        RTRIM(Mxxmmc) as name,
        RTRIM(Mzgg) as spec,
        Jl as dosePerUnit
      FROM JB_SFXMMXK 
      ORDER BY Mxxmmc
    `;
    
    const result = await pool.request().query(query);
    await pool.close();
    
    return NextResponse.json({
      success: true,
      count: result.recordset.length,
      drugs: result.recordset
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}
