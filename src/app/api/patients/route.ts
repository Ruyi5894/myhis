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
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

// 获取患者列表（住院+门诊）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');
  const keyword = searchParams.get('keyword') || '';
  
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const patientType = searchParams.get('type') || 'all';

  try {
    const pool = await getPool();
    const offset = (page - 1) * pageSize;
    
    let zyDateCondition = '';
    let mzDateCondition = '';
    
    if (startDate && endDate) {
      zyDateCondition = ` AND ryrq >= '${startDate} 00:00:00' AND ryrq <= '${endDate} 23:59:59'`;
      mzDateCondition = ` AND zdrq >= '${startDate} 00:00:00' AND zdrq <= '${endDate} 23:59:59'`;
    } else if (startDate) {
      zyDateCondition = ` AND ryrq >= '${startDate} 00:00:00'`;
      mzDateCondition = ` AND zdrq >= '${startDate} 00:00:00'`;
    } else if (endDate) {
      zyDateCondition = ` AND ryrq <= '${endDate} 23:59:59'`;
      mzDateCondition = ` AND zdrq <= '${endDate} 23:59:59'`;
    }
    
    let zyKeywordCondition = '';
    let mzKeywordCondition = '';
    if (keyword) {
      zyKeywordCondition = ` AND (xm LIKE '%${keyword}%' OR kh LIKE '%${keyword}%' OR zyh LIKE '%${keyword}%')`;
      mzKeywordCondition = ` AND (b.xm LIKE '%${keyword}%' OR y.Zdmc LIKE '%${keyword}%' OR y.xbs LIKE '%${keyword}%')`;
    }

    let results: any[] = [];
    let totalInpatient = 0;
    let totalOutpatient = 0;

    // 住院患者查询
    if (patientType === 'all' || patientType === 'inpatient') {
      const zyQuery = `
        SELECT * FROM (
          SELECT 
            ROW_NUMBER() OVER (ORDER BY ryrq DESC) AS RowNum,
            zlh, jbxxbh, kh, knxx, zyh, xm, xb, csny, '' AS sfz, pzh, 
            ryrq, cyrq, ryzd, ryks, rybq, djzt, 
            '住院' AS jzlx,
            DATEDIFF(DAY, ryrq, ISNULL(cyrq, GETDATE())) AS days,
            CASE WHEN cyrq IS NULL THEN '在院' ELSE '已出院' END AS status
          FROM ZY_BRZLXXK
          WHERE 1=1 ${zyDateCondition} ${zyKeywordCondition}
        ) AS ZYPage
        WHERE RowNum BETWEEN ${offset + 1} AND ${offset + pageSize}
      `;
      const zyResult = await pool.request().query(zyQuery);
      results = [...results, ...zyResult.recordset];
      
      const zyCountQuery = `SELECT COUNT(*) as cnt FROM ZY_BRZLXXK WHERE 1=1 ${zyDateCondition} ${zyKeywordCondition}`;
      const zyCount = await pool.request().query(zyCountQuery);
      totalInpatient = zyCount.recordset[0].cnt;
    }

    // 门诊患者查询 - 使用 MZYSZ_YSZDK 获取完整病史
    if (patientType === 'all' || patientType === 'outpatient') {
      const mzQuery = `
        SELECT * FROM (
          SELECT 
            ROW_NUMBER() OVER (ORDER BY y.zdrq DESC) AS RowNum,
            y.zlh AS zlh, 
            y.jbxxbh AS jbxxbh, 
            '' AS kh, 
            '' AS knxx, 
            '' AS zyh, 
            ISNULL(b.xm, '未知患者') AS xm, 
            ISNULL(b.xb, 0) AS xb, 
            b.csny, 
            ISNULL(b.sfz, '') AS sfz, 
            '' AS pzh,
            y.zdrq AS ryrq, 
            NULL AS cyrq, 
            y.Zdmc AS ryzd, 
            y.Ssy AS ryks, 
            0 AS rybq, 
            y.Jlzt AS djzt,
            '门诊' AS jzlx,
            0 AS days,
            '已完成' AS status,
            y.xbs AS zhushu,    -- 主诉/现病史
            y.Zddm AS zddm,     -- 诊断代码
            y.Szy AS szy,       -- 主治医生
            b.lxdh AS lxdh,
            b.dz AS dz
          FROM MZYSZ_YSZDK y
          LEFT JOIN BC_BRXXK b ON y.jbxxbh = b.jbxxbh
          WHERE 1=1 ${mzDateCondition} ${mzKeywordCondition}
        ) AS MZPage
        WHERE RowNum BETWEEN ${offset + 1} AND ${offset + pageSize}
      `;
      const mzResult = await pool.request().query(mzQuery);
      results = [...results, ...mzResult.recordset];
      
      const mzCountQuery = `
        SELECT COUNT(*) as cnt FROM MZYSZ_YSZDK y
        LEFT JOIN BC_BRXXK b ON y.jbxxbh = b.jbxxbh
        WHERE 1=1 ${mzDateCondition} ${mzKeywordCondition}
      `;
      const mzCount = await pool.request().query(mzCountQuery);
      totalOutpatient = mzCount.recordset[0].cnt;
    }

    results.sort((a, b) => new Date(b.ryrq).getTime() - new Date(a.ryrq).getTime());

    return NextResponse.json({
      success: true,
      data: results,
      total: patientType === 'inpatient' ? totalInpatient : 
             patientType === 'outpatient' ? totalOutpatient : 
             totalInpatient + totalOutpatient,
      stats: {
        inpatient: totalInpatient,
        outpatient: totalOutpatient,
      },
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: '数据库连接失败: ' + String(error) },
      { status: 500 }
    );
  }
}
