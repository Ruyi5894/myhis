const sql = require('mssql');
const config = {
  server: '192.168.1.243',
  database: 'myhis',
  user: 'sa',
  password: 'RfVbGtUjM,Ki',
  options: { encrypt: false, trustServerCertificate: true }
};

async function checkZs() {
  try {
    const pool = await sql.connect(config);
    
    // 查几条数据对比 zs 和 xbs
    const data = await pool.request().query(`
      SELECT TOP 5 
        zlh, 
        zs AS 主诉, 
        xbs AS 现病史,
        LEN(ISNULL(zs, '')) AS 主诉长度,
        LEN(xbs) AS 现病史长度
      FROM MZYSZ_YSZDK 
      WHERE zs IS NOT NULL AND xbs IS NOT NULL
      ORDER BY NEWID()
    `);
    
    console.log('主诉(Zs) vs 现病史(Xbs) 对比:');
    data.recordset.forEach((row, i) => {
      console.log(`\n=== 记录 ${i+1} (zlh: ${row.zlh}) ===`);
      console.log('主诉:', row.主诉?.substring(0, 80));
      console.log('现病史:', row.现病史?.substring(0, 80));
      console.log(`长度: 主诉=${row.主诉长度}, 现病史=${row.现病史长度}`);
    });
    
    await sql.close();
  } catch (e) {
    console.error('错误:', e.message);
  }
}

checkZs();
