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

// 获取门诊就诊详情 - 按卫健委规范组织病史信息
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const pool = await getPool();
    
    // 基本信息 + 病历记录
    const basicQuery = `
      SELECT TOP 1 
        y.zlh,
        y.jbxxbh,
        ISNULL(p.Xm, '未知') AS xm,
        CASE ISNULL(p.Xb, 0) WHEN 0 THEN '女' WHEN 1 THEN '男' ELSE '未知' END AS xb_text,
        p.Csny AS csny,
        p.Sfz AS sfz,
        p.Dhhm AS lxdh,
        p.Jtdz AS dz,
        p.Zy AS zy,                     -- 职业
        y.zdrq AS ryrq,
        y.Zdmc AS ryzd,                 -- 初步诊断（诊断名称）
        y.Zddm AS zddm,                -- 诊断代码
        y.Zs AS zs,                    -- 主诉
        y.xbs AS xbs,                  -- 现病史
        y.Tj AS tjbg,                  -- 体格检查
        y.Bz AS clcs,                  -- 处理措施/备注
        y.Mb AS mb,                    -- 脉搏
        y.Xt AS xt,                    -- 血压/体征
        y.Tw AS tw,                    -- 体温
        y.Zdys AS zzys,                -- 主诊医师
        y.Szy AS kzys,                 -- 开方医师
        g.Fymc AS fymc,
        g.Ghf AS ghf
      FROM MZYSZ_YSZDK y
      LEFT JOIN GH_MXXXK g ON y.zlh = g.zlh
      LEFT JOIN XT_BRJBXXK p ON y.jbxxbh = p.Jbxxbh AND y.jbxxbh > 0
      WHERE y.zlh = ${id}
      ORDER BY y.zdrq DESC
    `;
    
    const basicResult = await pool.request().query(basicQuery);
    
    if (basicResult.recordset.length === 0) {
      return NextResponse.json({
        success: false,
        error: '未找到该就诊记录',
      });
    }

    const basic = basicResult.recordset[0];

    // 处方列表
    const prescriptionQuery = `
      SELECT 
        CFxh AS cfxh,
        brkh,
        cfysdm,
        cfje,
        cflx,
        cfrq,
        cfysksdm,
        cfzxksdm,
        sycfbz
      FROM MZYSZ_CFK
      WHERE brzlh = ${id}
      ORDER BY cfrq DESC
    `;
    const prescriptionResult = await pool.request().query(prescriptionQuery);

    // 处方明细
    const prescriptionDetailQuery = `
      SELECT 
        m.cfxh,
        m.cfmxxh,
        m.cfxmdm,
        CAST(x.Mzgg AS NVARCHAR(MAX)) AS Mzgg,
        m.Jl,
        m.sl,
        m.ypyf,
        m.ypsypldm,
        m.ypyl,
        ISNULL(m.cfxmmc, x.Mxxmmc) AS cfxmmc
      FROM MZYSZ_CFMXK m
      INNER JOIN JB_SFXMMXK x ON RTRIM(m.cfxmdm) = RTRIM(x.Mxxmdm)
      WHERE m.cfxh IN (SELECT CFxh FROM MZYSZ_CFK WHERE brzlh = ${id})
      ORDER BY m.cfmxxh DESC
    `;
    const prescriptionDetailResult = await pool.request().query(prescriptionDetailQuery);

    // 费用汇总
    const feeSummaryQuery = `
      SELECT 
        COUNT(*) AS cf_count,
        ISNULL(SUM(cfje), 0) AS total_cfje,
        ISNULL(SUM(g.Ghf), 0) AS total_ghf
      FROM MZYSZ_CFK c
      LEFT JOIN GH_MXXXK g ON c.brzlh = g.zlh
      WHERE c.brzlh = ${id}
    `;
    const feeSummaryResult = await pool.request().query(feeSummaryQuery);

    // 计算年龄
    let nl = '-';
    if (basic.csny) {
      const birthDate = new Date(basic.csny);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        nl = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toString();
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        // 门诊病历首页
        basicInfo: {
          name: basic.xm?.trim(),
          gender: basic.xb_text,
          age: nl + '岁',
          cardNo: basic.sfz?.trim() || '-',
          phone: basic.lxdh?.trim() || '-',
          address: basic.dz?.trim() || '-',
          occupation: basic.zy?.trim() || '-',
          visitDate: basic.ryrq,
          dept: basic.ssy || '-',
        },
        // 病历记录
        medicalRecord: {
          // 主诉 - 使用 zs 字段
          chiefComplaint: basic.zs?.trim() || (basic.xbs?.trim() ? '（从现病史提取）' + basic.xbs?.trim()?.split('。')[0] + '。' : '-'),
          // 现病史
          presentIllness: basic.xbs?.trim() || '-',
          // 既往史 - 数据库暂无此字段
          pastHistory: '-',
          // 体格检查
          physicalExam: basic.tjbg?.trim() || '-',
          // 初步诊断
          preliminaryDiagnosis: basic.ryzd?.trim() || '-',
          diagnosisCode: basic.zddm?.trim() || '-',
          // 处理措施
          treatment: basic.clcs?.trim() || '-',
        },
        // 生命体征
        vitalSigns: {
          bloodPressure: basic.xt || '-',
          heartRate: basic.mb || '-',
          temperature: basic.tw ? basic.tw + '°C' : '-',
        },
        // 医师签名
        signature: {
          doctor: basic.kzys?.toString().trim() || '-',
          signDate: basic.ryrq,
        },
        // 处方信息
        prescriptions: prescriptionResult.recordset,
        prescriptionDetails: prescriptionDetailResult.recordset,
        feeSummary: feeSummaryResult.recordset[0],
      },
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: '数据库连接失败: ' + String(error) },
      { status: 500 }
    );
  }
}
