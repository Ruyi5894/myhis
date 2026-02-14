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
  
  // 时间范围筛选（默认：本月1号至今）
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  
  // 住院/门诊筛选
  const patientType = searchParams.get('type') || 'all'; // all, inpatient, outpatient

  try {
    const pool = await getPool();
    
    // 构建日期筛选条件
    let dateCondition = '';
    if (startDate && endDate) {
      dateCondition = ` AND ryrq >= '${startDate} 00:00:00' AND ryrq <= '${endDate} 23:59:59'`;
    } else if (startDate) {
      dateCondition = ` AND ryrq >= '${startDate} 00:00:00'`;
    } else if (endDate) {
      dateCondition = ` AND ryrq <= '${endDate} 23:59:59'`;
    }
    
    // 构建关键词搜索条件
    let keywordCondition = '';
    if (keyword) {
      keywordCondition = ` AND (xm LIKE '%${keyword}%' OR kh LIKE '%${keyword}%' OR zyh LIKE '%${keyword}%' OR sfz LIKE '%${keyword}%')`;
    }

    let results: any[] = [];
    let totalInpatient = 0;
    let totalOutpatient = 0;

    // 查询住院患者
    if (patientType === 'all' || patientType === 'inpatient') {
      const zyQuery = `
        SELECT TOP ${pageSize} 
          zlh, jbxxbh, kh, knxx, zyh, xm, xb, csny, sfz, pzh, 
          ryrq, cyrq, ryzd, ryks, rybq, djzt, 
          '住院' AS jzlx,
          DATEDIFF(DAY, ryrq, ISNULL(cyrq, GETDATE())) AS days,
          CASE WHEN cyrq IS NULL THEN '在院' ELSE '已出院' END AS status
        FROM ZY_BRZLXXK
        WHERE 1=1 ${dateCondition} ${keywordCondition}
        ORDER BY ryrq DESC
        OFFSET ${(page - 1) * pageSize} ROWS
      `;
      const zyResult = await pool.request().query(zyQuery);
      results = [...results, ...zyResult.recordset];
      
      // 获取住院总数
      const zyCountQuery = `SELECT COUNT(*) as cnt FROM ZY_BRZLXXK WHERE 1=1 ${dateCondition} ${keywordCondition}`;
      const zyCount = await pool.request().query(zyCountQuery);
      totalInpatient = zyCount.recordset[0].cnt;
    }

    // 查询门诊患者
    if (patientType === 'all' || patientType === 'outpatient') {
      let mzDateCondition = dateCondition.replace(/ryrq/g, 'ghrq');
      const mzQuery = `
        SELECT TOP ${pageSize} 
          g.zlh, g.jbxxbh, g.kh, '' AS knxx, '' AS zyh, 
          ISNULL(p.xm, '未知') AS xm, ISNULL(p.xb, 0) AS xb, 
          p.csny, p.sfz, '' AS pzh,
          g.ghrq AS ryrq, NULL AS cyrq, '' AS ryzd, 
          g.ksdm AS ryks, 0 AS rybq, g.jlzt AS djzt,
          '门诊' AS jzlx,
          0 AS days,
          '已完成' AS status
        FROM GH_MXXXK g
        LEFT JOIN JB_JKDAJZSK p ON g.jbxxbh = p.jbxxbh
        WHERE 1=1 ${mzDateCondition}
        ${keyword ? `AND (p.xm LIKE '%${keyword}%' OR g.kh LIKE '%${keyword}%')` : ''}
        ORDER BY g.ghrq DESC
        OFFSET ${(page - 1) * pageSize} ROWS
      `;
      const mzResult = await pool.request().query(mzQuery);
      results = [...results, ...mzResult.recordset];
      
      // 获取门诊总数
      let mzDateConditionCount = dateCondition.replace(/ryrq/g, 'ghrq');
      const mzCountQuery = `
        SELECT COUNT(*) as cnt FROM GH_MXXXK g
        LEFT JOIN JB_JKDAJZSK p ON g.jbxxbh = p.jbxxbh
        WHERE 1=1 ${mzDateConditionCount}
        ${keyword ? `AND (p.xm LIKE '%${keyword}%' OR g.kh LIKE '%${keyword}%')` : ''}
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
