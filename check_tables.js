const sql = require('mssql');
const config = {
  server: '192.168.1.243',
  database: 'myhis',
  user: 'sa',
  password: 'RfVbGtUjM,Ki',
  options: { encrypt: false, trustServerCertificate: true }
};

async function checkTables() {
  try {
    const pool = await sql.connect(config);
    
    // 查找可能包含"诉"字的字段
    const tables = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME LIKE 'MZYSZ%' OR TABLE_NAME LIKE 'GH_%'
    `);
    
    console.log('相关表:');
    tables.recordset.forEach(t => console.log('  ' + t.TABLE_NAME));
    
    // 检查 MZYSZ_YSZDK 的所有文本字段
    const cols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'MZYSZ_YSZDK' 
        AND DATA_TYPE IN ('varchar', 'nvarchar', 'text', 'ntext')
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\nMZYSZ_YSZDK 文本字段:');
    cols.recordset.forEach(row => {
      console.log(`  ${row.COLUMN_NAME} (${row.DATA_TYPE}${row.CHARACTER_MAXIMUM_LENGTH ? '(' + row.CHARACTER_MAXIMUM_LENGTH + ')' : ''})`);
    });
    
    await sql.close();
  } catch (e) {
    console.error('错误:', e.message);
  }
}

checkTables();
