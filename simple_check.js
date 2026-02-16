const sql = require('mssql');
sql.connect({server:'192.168.1.243',database:'myhis',user:'sa',password:'RfVbGtUjM,Ki',options:{encrypt:false,trustServerCertificate:true}})
  .then(pool => pool.request().query('SELECT TOP 2 zlh, zs, xbs FROM MZYSZ_YSZDK WHERE zs IS NOT NULL AND LEN(zs) > 5'))
  .then(r => { r.recordset.forEach(row => { console.log('zlh:', row.zlh); console.log('zs:', row.zs?.substring(0,50)); console.log('xbs:', row.xbs?.substring(0,50)); console.log('---'); }); })
  .catch(e => console.error(e.message));
