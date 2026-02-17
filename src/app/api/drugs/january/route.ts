import { NextResponse } from 'next/server';
import sql from 'mssql';

const dbConfig = {
  server: process.env.DB_SERVER || '192.168.1.248',
  database: process.env.DB_NAME || 'HIS3',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'P@ssw0rd',
  port: parseInt(process.env.DB_PORT || '1433'),
  options: { encrypt: false, trustServerCertificate: true },
};

let pool: sql.ConnectionPool | null = null;

async function getPool() {
  if (!pool) pool = await sql.connect(dbConfig);
  return pool;
}

// 获取1月份所有药品（去重）
export async function GET() {
  try {
    const poolConn = await getPool();
    
    // 获取1月份所有处方明细中的药品规格 - 限制500条
    const result = await poolConn.request()
      .query(`
        SELECT TOP 500
          ISNULL(m.cfxmmc, x.Mxxmmc) AS drugName,
          x.Mzgg AS spec,
          m.ypyl AS dailyDose,
          m.ypyldw AS doseUnit,
          m.ypsypldm AS usage,
          m.sl AS quantity
        FROM MZYSZ_CFMXK m
        INNER JOIN JB_SFXMMXK x ON RTRIM(m.cfxmdm) = RTRIM(x.Mxxmdm)
        INNER JOIN MZYSZ_CFK c ON m.cfxh = c.CFxh
        WHERE c.ryrq >= '2026-01-01' AND c.ryrq < '2026-02-01'
        AND x.Mzgg IS NOT NULL AND LEN(x.Mzgg) > 0
        GROUP BY m.cfxmmc, x.Mxxmmc, x.Mzgg, m.ypyl, m.ypyldw, m.ypsypldm, m.sl
      `);

    // 按药品名称去重
    const drugMap = new Map();
    for (const row of result.recordset) {
      const name = (row.drugName || '').trim();
      if (!name) continue;
      
      if (!drugMap.has(name)) {
        drugMap.set(name, {
          name,
          spec: (row.spec || '').trim(),
          dailyDose: row.dailyDose,
          doseUnit: (row.doseUnit || '').trim(),
          usage: (row.usage || '').trim(),
          quantity: row.quantity
        });
      }
    }

    const drugs = Array.from(drugMap.values());

    return NextResponse.json({
      success: true,
      count: drugs.length,
      drugs
    });

  } catch (error) {
    console.error('获取药品列表失败:', error);
    return NextResponse.json({ success: false, error: String(error) });
  }
}
