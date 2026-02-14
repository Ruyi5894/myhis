import { NextResponse } from 'next/server';
import sql from 'mssql';

// 数据库配置
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
  
  // 时间范围筛选
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  
  // 住院/门诊筛选
  const patientType = searchParams.get('type') || 'all';

  try {
    const pool = await getPool();
    const offset = (page - 1) * pageSize;
    
    // 构建日期筛选条件
    let zyDateCondition = '';
    let mzDateCondition = '';
    
    if (startDate && endDate) {
      zyDateCondition = ` AND ryrq >= '${startDate} 00:00:00' AND ryrq <= '${endDate} 23:59:59'`;
      mzDateCondition = ` AND ghrq >= '${startDate} 00:00:00' AND ghrq <= '${endDate} 23:59:59'`;
    } else if (startDate) {
      zyDateCondition = ` AND ryrq >= '${startDate} 00:00:00'`;
      mzDateCondition = ` AND ghrq >= '${startDate} 00:00:00'`;
    } else if (endDate) {
      zyDateCondition = ` AND ryrq <= '${endDate} 23:59:59'`;
      mzDateCondition = ` AND ghrq <= '${endDate} 23:59:59'`;
    }
    
    // 构建关键词搜索条件
    let zyKeywordCondition = '';
    let mzKeywordCondition = '';
    if (keyword) {
      zyKeywordCondition = ` AND (xm LIKE '%${keyword}%' OR kh LIKE '%${keyword}%' OR zyh LIKE '%${keyword}%')`;
      mzKeywordCondition = ` AND (b.xm LIKE '%${keyword}%' OR d.kh LIKE '%${keyword}%' OR b.sfz LIKE '%${keyword}%')`;
    }

    let results: any[] = [];
    let totalInpatient = 0;
    let totalOutpatient = 0;

    // 查询住院患者
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
      
      // 获取住院总数
      const zyCountQuery = `SELECT COUNT(*) as cnt FROM ZY_BRZLXXK WHERE 1=1 ${zyDateCondition} ${zyKeywordCondition}`;
      const zyCount = await pool.request().query(zyCountQuery);
      totalInpatient = zyCount.recordset[0].cnt;
    }

    // 查询门诊患者 - 关联获取患者基本信息
    if (patientType === 'all' || patientType === 'outpatient') {
      const mzQuery = `
        SELECT * FROM (
          SELECT 
            ROW_NUMBER() OVER (ORDER BY g.ghrq DESC) AS RowNum,
            g.zlh AS zlh, g.zlh AS jbxxbh, d.kh AS kh, '' AS knxx, '' AS zyh, 
            ISNULL(b.xm, '未知患者') AS xm, ISNULL(b.xb, 0) AS xb, b.csny, ISNULL(b.sfz, '') AS sfz, '' AS pzh,
            g.ghrq AS ryrq, NULL AS cyrq, g.Fymc AS ryzd, 
            g.ksdm AS ryks, 0 AS rybq, g.jlzt AS djzt,
            '门诊' AS jzlx,
            0 AS days,
            '已完成' AS status,
            b.lxdh AS lxdh,
            b.dz AS dz
          FROM GH_MXXXK g
          LEFT JOIN GH_DBBRXXK d ON g.zlh = d.zlh
          LEFT JOIN BC_BRXXK b ON d.jbxxbh = b.jbxxbh
          WHERE 1=1 ${mzDateCondition} ${mzKeywordCondition}
        ) AS MZPage
        WHERE RowNum BETWEEN ${offset + 1} AND ${offset + pageSize}
      `;
      const mzResult = await pool.request().query(mzQuery);
      results = [...results, ...mzResult.recordset];
      
      // 获取门诊总数
      const mzCountQuery = `
        SELECT COUNT(*) as cnt FROM GH_MXXXK g
        LEFT JOIN GH_DBBRXXK d ON g.zlh = d.zlh
        LEFT JOIN BC_BRXXK b ON d.jbxxbh = b.jbxxbh
        WHERE 1=1 ${mzDateCondition} ${mzKeywordCondition}
      `;
      const mzCount = await pool.request().query(mzCountQuery);
      totalOutpatient = mzCount.recordset[0].cnt;
    }

    // 按日期排序（最新的在前）
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
