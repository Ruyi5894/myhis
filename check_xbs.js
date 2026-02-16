const sql = require('mssql');
const config = {
  server: '192.168.1.243',
  database: 'myhis',
  user: 'sa',
  password: 'RfVbGtUjM,Ki',
  options: { encrypt: false, trustServerCertificate: true }
};

async function checkTable() {
  try {
    const pool = await sql.connect(config);
    // 查字段列表
    const cols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'MZYSZ_YSZDK'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('MZYSZ_YSZDK 字段列表:');
    cols.recordset.forEach(row => console.log('  ' + row.COLUMN_NAME + ' (' + row.DATA_TYPE + ')'));
    
    // 查几条数据看 xbs 内容
    const data = await pool.request().query(`
      SELECT TOP 3 zlh, xbs FROM MZYSZ_YSZDK WHERE LEN(xbs) > 20 ORDER BY NEWID()
    `);
    console.log('\n现病史示例:');
    data.recordset.forEach(row => {
      console.log('zlh:', row.zlh);
      console.log('xbs:', row.xbs?.substring(0, 150));
      console.log('---');
    });
    await sql.close();
  } catch (e) {
    console.error('错误:', e.message);
  }
}

checkTable();
