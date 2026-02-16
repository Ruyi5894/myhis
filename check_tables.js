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
    
    // 查找可能的医生/员工表
    const tables = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME LIKE '%YG%' OR TABLE_NAME LIKE '%YS%' OR TABLE_NAME LIKE '%EMPLOYEE%'
    `);
    
    console.log('可能的员工/医生表:');
    tables.recordset.forEach(t => console.log('  ' + t.TABLE_NAME));
    
    await sql.close();
  } catch (e) {
    console.error('错误:', e.message);
  }
}

checkTables();
