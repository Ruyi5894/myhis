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
};

let pool: sql.ConnectionPool | null = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

// 获取门诊就诊列表 - 按zlh去重，显示诊断名称，可过滤简易门诊
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');
  const keyword = searchParams.get('keyword') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const excludeSimple = searchParams.get('excludeSimple') === 'true';
  const dept = searchParams.get('dept') || '';  // 科室筛选
  const doctor = searchParams.get('doctor') || '';  // 医生筛选
  const sortField = searchParams.get('sortField') || 'zdrq';  // 排序字段
  const sortOrder = searchParams.get('sortOrder') || 'desc';  // 排序方向

  try {
    const pool = await getPool();
    const offset = (page - 1) * pageSize;
    
    // 排序字段映射
    const sortFieldMap: Record<string, string> = {
      zdrq: 'zd.zdrq',
      cfje: 'cfje',
      doctor_name: 'doctor_name',
    };
    const orderByField = sortFieldMap[sortField] || 'zd.zdrq';
    const orderByDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    let dateCondition = '';
    if (startDate && endDate) {
      dateCondition = ` AND zdrq >= '${startDate} 00:00:00' AND zdrq <= '${endDate} 23:59:59'`;
    } else if (startDate) {
      dateCondition = ` AND zdrq >= '${startDate} 00:00:00'`;
    } else if (endDate) {
      dateCondition = ` AND zdrq <= '${endDate} 23:59:59'`;
    }
    
    let keywordCondition = '';
    if (keyword) {
      keywordCondition = ` AND (
        p.Xm LIKE '%${keyword}%' OR 
        p.Sfz LIKE '%${keyword}%' OR 
        zd.ryzd LIKE '%${keyword}%' OR 
        zd.zhushu LIKE '%${keyword}%' OR 
        zd.zlh = '${keyword}'
      )`;
    }

    // 科室筛选条件
    let deptCondition = '';
    if (dept) {
      deptCondition = ` AND zd.Ksdm = '${dept}'`;
    }

    // 医生筛选条件
    let doctorCondition = '';
    if (doctor) {
      doctorCondition = ` AND zd.szy = '${doctor}'`;
    }

    // 按zlh去重，获取主要诊断名称，可排除简易门诊
    const mzQuery = `
      SELECT * FROM (
        SELECT 
          ROW_NUMBER() OVER (ORDER BY ${orderByField} ${orderByDirection}) AS RowNum,
          zd.zlh,
          zd.jbxxbh,
          ISNULL(p.Xm, '未知') AS xm,
          CASE ISNULL(p.Xb, 0) WHEN 0 THEN '女' WHEN 1 THEN '男' ELSE '未知' END AS xb_text,
          p.Csny AS csny,
          p.Sfz AS sfz,
          p.Dhhm AS lxdh,
          p.Jtdz AS dz,
          zd.zdrq AS ryrq,
          zd.ryzd,
          zd.zddm,
          zd.zhushu,
          zd.ssy,
          zd.szy,
          zd.Ksdm,
          zd.Ksmc AS ksdm_text,
          g.Fymc AS fymc,
          g.Ghf AS ghf,
          (SELECT ISNULL(SUM(cfje), 0) FROM MZYSZ_CFK WHERE brzlh = zd.zlh) AS cfje,
          (SELECT COUNT(*) FROM MZYSZ_CFK WHERE brzlh = zd.zlh) AS cf_count,
          (SELECT COUNT(*) FROM MZYSZ_CFMXK WHERE cfxh IN (SELECT CFxh FROM MZYSZ_CFK WHERE brzlh = zd.zlh)) AS yp_count,
          ISNULL(doc.zgxm, CAST(zd.zzys AS VARCHAR)) AS doctor_name,
          zd.zzys AS doctor_code
        FROM (
          SELECT 
            y.zlh,
            MAX(y.zdrq) AS zdrq,
            MAX(y.jbxxbh) AS jbxxbh,
            MAX(g.Ksdm) AS Ksdm,
            MAX(k.Ksmc) AS Ksmc,
            STRING_AGG(CONVERT(VARCHAR(500), ISNULL(d.zdmc, '')), '; ') AS ryzd,
            STRING_AGG(CONVERT(VARCHAR(200), ISNULL(y.Zddm, '')), '; ') AS zddm,
            MAX(CONVERT(VARCHAR(500), y.xbs)) AS zhushu,
            MAX(y.ssy) AS ssy,
            MAX(y.szy) AS szy,
            MAX(y.Zdys) AS zzys
          FROM MZYSZ_YSZDK y
          LEFT JOIN JB_ZDDMK d ON RTRIM(y.Zddm) = RTRIM(d.zddm)
          LEFT JOIN GH_MXXXK g ON y.zlh = g.zlh
          LEFT JOIN JB_KSBMK k ON g.Ksdm = k.Ksdm
          WHERE 1=1 ${dateCondition}
          GROUP BY y.zlh
        ) zd
        LEFT JOIN GH_MXXXK g ON zd.zlh = g.zlh
        LEFT JOIN YBsjcj_JB_ZGBMK doc ON zd.zzys = doc.zgdm
        LEFT JOIN XT_BRJBXXK p ON zd.jbxxbh = p.Jbxxbh AND zd.jbxxbh > 0
        WHERE 1=1 ${keywordCondition}${deptCondition}${doctorCondition}
        ${excludeSimple ? ` AND (
          zd.zhushu NOT LIKE '%复诊%' 
          AND zd.zhushu NOT LIKE '%配药%' 
          AND zd.zhushu NOT LIKE '%开药%'
          AND zd.zhushu NOT LIKE '%随访%'
          AND zd.zhushu NOT LIKE '%随诊%'
          AND zd.zhushu NOT LIKE '%续方%'
          AND zd.zhushu NOT LIKE '%续开%'
          AND zd.zhushu NOT LIKE '%拿药%'
          AND zd.zhushu NOT LIKE '%取药%'
          AND zd.zhushu NOT LIKE '%常规复查%'
          AND zd.zhushu NOT LIKE '%复查%'
          AND zd.zhushu NOT LIKE '%目前病情稳定%'
          AND zd.zhushu NOT LIKE '%维持原治疗%'
          AND zd.zhushu NOT LIKE '%维持原方案%'
          AND zd.zhushu NOT LIKE '%继续服药%'
          AND zd.zhushu NOT LIKE '%继续用药%'
          AND zd.zhushu NOT LIKE '%按时服药%'
        )` : ''}
      ) AS MZPage
      WHERE RowNum BETWEEN ${offset + 1} AND ${offset + pageSize}
    `;
    
    const mzResult = await pool.request().query(mzQuery);
    
    // 获取总数
    let countQuery = `
      SELECT COUNT(DISTINCT zlh) as cnt 
      FROM MZYSZ_YSZDK y
      WHERE 1=1 ${dateCondition}
    `;
    
    // 如果需要排除简易门诊，检查xbs字段
    if (excludeSimple) {
      countQuery = `
        SELECT COUNT(DISTINCT zlh) as cnt 
        FROM MZYSZ_YSZDK y
        WHERE 1=1 ${dateCondition}
        AND (
          y.xbs NOT LIKE '%复诊%' 
          AND y.xbs NOT LIKE '%配药%' 
          AND y.xbs NOT LIKE '%开药%'
          AND y.xbs NOT LIKE '%随访%'
          AND y.xbs NOT LIKE '%随诊%'
          AND y.xbs NOT LIKE '%续方%'
          AND y.xbs NOT LIKE '%续开%'
          AND y.xbs NOT LIKE '%拿药%'
          AND y.xbs NOT LIKE '%取药%'
          AND y.xbs NOT LIKE '%常规复查%'
          AND y.xbs NOT LIKE '%复查%'
          AND y.xbs NOT LIKE '%目前病情稳定%'
          AND y.xbs NOT LIKE '%维持原治疗%'
          AND y.xbs NOT LIKE '%维持原方案%'
          AND y.xbs NOT LIKE '%继续服药%'
          AND y.xbs NOT LIKE '%继续用药%'
          AND y.xbs NOT LIKE '%按时服药%'
        )
      `;
    }
    const countResult = await pool.request().query(countQuery);
    const total = countResult.recordset[0].cnt;

    // 获取当前搜索结果中的科室列表 - 与患者列表保持一致
    const deptQuery = `
      SELECT DISTINCT g.Ksdm, k.Ksmc, k.Ksmc AS sort_key
      FROM (
        SELECT y.zlh
        FROM MZYSZ_YSZDK y
        WHERE 1=1 ${dateCondition}
        ${keywordCondition.replace(/zd\./g, 'y.')}
        ${excludeSimple ? ` AND (
          y.xbs NOT LIKE '%复诊%' AND y.xbs NOT LIKE '%配药%' AND y.xbs NOT LIKE '%开药%'
          AND y.xbs NOT LIKE '%随访%' AND y.xbs NOT LIKE '%随诊%' AND y.xbs NOT LIKE '%续方%'
          AND y.xbs NOT LIKE '%续开%' AND y.xbs NOT LIKE '%拿药%' AND y.xbs NOT LIKE '%取药%'
          AND y.xbs NOT LIKE '%常规复查%' AND y.xbs NOT LIKE '%复查%'
          AND y.xbs NOT LIKE '%目前病情稳定%' AND y.xbs NOT LIKE '%维持原治疗%'
          AND y.xbs NOT LIKE '%维持原方案%' AND y.xbs NOT LIKE '%继续服药%'
          AND y.xbs NOT LIKE '%继续用药%' AND y.xbs NOT LIKE '%按时服药%'
        )` : ''}
      ) y
      INNER JOIN GH_MXXXK g ON y.zlh = g.zlh
      LEFT JOIN JB_KSBMK k ON g.Ksdm = k.Ksdm
      WHERE g.Ksdm IS NOT NULL AND g.Ksdm != '' AND g.Ksdm != '1000'
      ORDER BY sort_key
    `;
    const deptResult = await pool.request().query(deptQuery);

    // 获取当前搜索结果中的医生列表 - 使用就诊医生(Zdys)
    const doctorQuery = `
      SELECT DISTINCT y.Zdys AS Ygdm, ISNULL(doc.zgxm, CAST(y.Zdys AS VARCHAR)) AS doctor_name
      FROM (
        SELECT y.zlh, y.Zdys
        FROM MZYSZ_YSZDK y
        WHERE 1=1 ${dateCondition}
        ${keywordCondition.replace(/zd\./g, 'y.')}
        ${excludeSimple ? ` AND (
          y.xbs NOT LIKE '%复诊%' AND y.xbs NOT LIKE '%配药%' AND y.xbs NOT LIKE '%开药%'
          AND y.xbs NOT LIKE '%随访%' AND y.xbs NOT LIKE '%随诊%' AND y.xbs NOT LIKE '%续方%'
          AND y.xbs NOT LIKE '%续开%' AND y.xbs NOT LIKE '%拿药%' AND y.xbs NOT LIKE '%取药%'
          AND y.xbs NOT LIKE '%常规复查%' AND y.xbs NOT LIKE '%复查%'
          AND y.xbs NOT LIKE '%目前病情稳定%' AND y.xbs NOT LIKE '%维持原治疗%'
          AND y.xbs NOT LIKE '%维持原方案%' AND y.xbs NOT LIKE '%继续服药%'
          AND y.xbs NOT LIKE '%继续用药%' AND y.xbs NOT LIKE '%按时服药%'
        )` : ''}
      ) y
      INNER JOIN YBsjcj_JB_ZGBMK doc ON y.Zdys = doc.zgdm
      WHERE y.Zdys IS NOT NULL AND y.Zdys > 0
    `;
    const doctorResult = await pool.request().query(doctorQuery);

    return NextResponse.json({
      success: true,
      data: mzResult.recordset,
      total: total,
      page,
      pageSize,
      departments: deptResult.recordset,
      doctors: doctorResult.recordset,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: '数据库连接失败: ' + String(error) },
      { status: 500 }
    );
  }
}
