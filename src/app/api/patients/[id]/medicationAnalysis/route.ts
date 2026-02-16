import { NextResponse } from 'next/server';
import sql from 'mssql';

const config = {
  server: '192.168.1.243',
  database: 'myhis',
  user: 'sa',
  password: 'RfVbGtUjM,Ki',
  options: { encrypt: false, trustServerCertificate: true }
};

interface MedicationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: any;
}

interface MedicationSummary {
  name: string;
  totalDays: number;
  prescriptionCount: number;
  issues: MedicationIssue[];
  riskLevel: 'high' | 'medium' | 'low';
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: zlhParam } = await params;
  const zlh = parseInt(zlhParam);
  
  if (!zlh || isNaN(zlh)) {
    return NextResponse.json({ success: false, error: '无效的zlh' });
  }

  let pool: sql.ConnectionPool | null = null;
  
  try {
    pool = await sql.connect(config);
    
    // 获取患者信息
    const patientResult = await pool.request()
      .input('zlh', sql.Int, zlh)
      .query(`
        SELECT TOP 1 y.jbxxbh, y.zdrq, y.Zdys, y.ssy as dept_code,
          p.Xm, p.Xb, p.Csny,
          doc.zgxm as doctor_name,
          k.Ksmc as dept_name
        FROM MZYSZ_YSZDK y
        LEFT JOIN XT_BRJBXXK p ON y.jbxxbh = p.Jbxxbh
        LEFT JOIN YBsjcj_JB_ZGBMK doc ON y.Zdys = doc.zgdm
        LEFT JOIN GH_MXXXK g ON y.zlh = g.zlh
        LEFT JOIN JB_KSBMK k ON g.Ksdm = k.Ksdm
        WHERE y.zlh = @zlh 
        ORDER BY y.zdrq ASC
      `);
    
    if (patientResult.recordset.length === 0) {
      return NextResponse.json({ success: false, error: '未找到该患者' });
    }
    
    const patient = patientResult.recordset[0];
    const oneYearAgo = new Date(patient.zdrq);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
    
    // 获取1年内所有就诊和处方
    const visitsResult = await pool.request()
      .input('jbxxbh', sql.Int, patient.jbxxbh)
      .input('oneYearAgo', sql.DateTime, oneYearAgo)
      .query(`
        SELECT 
          y.zlh, y.zdrq, y.Zdys, g.Ksdm as dept_code,
          doc.zgxm as doctor_name,
          k.Ksmc as dept_name
        FROM MZYSZ_YSZDK y
        LEFT JOIN YBsjcj_JB_ZGBMK doc ON y.Zdys = doc.zgdm
        LEFT JOIN GH_MXXXK g ON y.zlh = g.zlh
        LEFT JOIN JB_KSBMK k ON g.Ksdm = k.Ksdm
        WHERE y.jbxxbh = @jbxxbh AND y.zdrq >= @oneYearAgo
        ORDER BY y.zdrq DESC
      `);

    // 获取所有处方明细
    const prescriptionsResult = await pool.request()
      .input('jbxxbh', sql.Int, patient.jbxxbh)
      .input('oneYearAgo', sql.DateTime, oneYearAgo)
      .query(`
        SELECT 
          cf.cfxh,
          CONVERT(VARCHAR(10), cf.cfrq, 120) AS cfrq,
          cf.cfysdm,
          cf.cfysksdm as dept_code,
          m.cfxmmc,
          m.sl,
          m.jl,
          m.ypyf,
          m.ypsypldm,
          m.ypyl,
          m.Mzgg,
          doc.zgxm as doctor_name,
          k.Ksmc as dept_name
        FROM MZYSZ_CFK cf
        INNER JOIN MZYSZ_CFMXK m ON cf.CFxh = m.CFxh
        LEFT JOIN YBsjcj_JB_ZGBMK doc ON cf.cfysdm = doc.zgdm
        LEFT JOIN JB_KSBMK k ON cf.cfysksdm = k.Ksdm
        WHERE cf.brzlh IN (SELECT y2.zlh FROM MZYSZ_YSZDK y2 WHERE y2.jbxxbh = @jbxxbh AND y2.zdrq >= @oneYearAgo)
        ORDER BY cf.cfrq DESC, m.cfxmmc
      `);

    // ========== 综合用药分析 ==========
    const medicationMap = new Map<string, {
      name: string;
      totalDays: number;
      prescriptions: any[];
      jl: number;
      issues: MedicationIssue[];
    }>();

    const doseGroupMap = new Map<string, {
      medications: string[];
      totalDays: number;
      totalPrescriptions: number;
    }>();

    // 统计医生和科室用药
    const doctorStats = new Map<string, { count: number; medications: Set<string> }>();
    const deptStats = new Map<string, { count: number; medications: Set<string> }>();

    // 分析每条处方
    for (const rx of prescriptionsResult.recordset) {
      const sl = parseFloat(rx.sl) || 0;
      const ypyf = (rx.ypsypldm || '').trim().toUpperCase();
      const jl = parseFloat(rx.jl) || 0;
      const ypyl = parseFloat(rx.ypyl) || 0;
      const mzgg = rx.Mzgg || '';
      const medName = (rx.cfxmmc || '').trim() || '未知药品';
      const doctor = (rx.doctor_name || '').trim() || '未知医生';
      const dept = (rx.dept_name || '').trim() || '未知科室';

      // 统计医生用药
      if (!doctorStats.has(doctor)) {
        doctorStats.set(doctor, { count: 0, medications: new Set() });
      }
      doctorStats.get(doctor)!.count++;
      doctorStats.get(doctor)!.medications.add(medName);

      // 统计科室用药
      if (!deptStats.has(dept)) {
        deptStats.set(dept, { count: 0, medications: new Set() });
      }
      deptStats.get(dept)!.count++;
      deptStats.get(dept)!.medications.add(medName);

      // ========== 计算天数 ==========
      if (!sl || !jl || ypyf === 'PRN' || ypyf === 'SOS' || ypyf === 'ST') {
        continue;
      }

      // 解析每盒片数
      let pillsPerBox = 1;
      const boxMatch = mzgg.match(/(\d+)\s*片/);
      if (boxMatch) {
        pillsPerBox = parseInt(boxMatch[1], 10);
      }

      // 计算频率
      let timesPerDay = 1;
      if (ypyf.includes('QD') || ypyf === '1' || ypyf === 'QN') timesPerDay = 1;
      else if (ypyf.includes('BID') || ypyf === '2') timesPerDay = 2;
      else if (ypyf.includes('TID') || ypyf === '3') timesPerDay = 3;
      else if (ypyf.includes('QID') || ypyf === '4') timesPerDay = 4;

      const totalPills = sl * pillsPerBox;
      const days = totalPills / timesPerDay;

      // 累计药品
      if (!medicationMap.has(medName)) {
        medicationMap.set(medName, {
          name: medName,
          totalDays: 0,
          prescriptions: [],
          jl: jl,
          issues: []
        });
      }

      const med = medicationMap.get(medName)!;
      med.totalDays += days;
      med.prescriptions.push({
        date: rx.cfrq,
        sl: sl,
        pillsPerBox,
        ypyf,
        days: Math.round(days),
        ypyl,
        doctor,
        dept
      });

      // ========== 问题检测 ==========
      const issues: MedicationIssue[] = [];

      // 1. 天数异常检测
      if (days < 3 && days > 0) {
        issues.push({
          type: 'SHORT_DURATION',
          severity: 'warning',
          message: `单次开具${Math.round(days)}天，疗程可能不足`
        });
      } else if (days > 90) {
        issues.push({
          type: 'LONG_DURATION',
          severity: 'warning',
          message: `单次开具${Math.round(days)}天，超过常规用量`
        });
      }

      // 2. 剂量单位异常检测
      if (ypyl > 0 && jl > 0) {
        // 检查用量是否合理 (例如: 0.5mg vs 100mg)
        // 如果ypyl远小于jl，可能单位有问题
        const ratio = ypyl / jl;
        if (ratio < 0.1 && ratio > 0) {
          issues.push({
            type: 'DOSE_UNIT_ISSUE',
            severity: 'error',
            message: `用量(${ypyl}mg)与规格(${jl}mg)差异过大，可能单位错误`
          });
        }
      }

      // 3. 检查ypyl是否为异常小值
      if (ypyl > 0 && ypyl < 1) {
        issues.push({
          type: 'ABNORMAL_LOW_DOSE',
          severity: 'warning',
          message: `用量(${ypyl}mg)异常偏小，请核实单位`
        });
      }

      med.issues = issues;

      // 同剂量药品累计
      const doseKey = `${jl}mg`;
      if (!doseGroupMap.has(doseKey)) {
        doseGroupMap.set(doseKey, { medications: [], totalDays: 0, totalPrescriptions: 0 });
      }
      const doseGroup = doseGroupMap.get(doseKey)!;
      if (!doseGroup.medications.includes(medName)) {
        doseGroup.medications.push(medName);
      }
      doseGroup.totalDays += days;
      doseGroup.totalPrescriptions++;
    }

    // 最终汇总
    const medications: MedicationSummary[] = [];
    const allIssues: MedicationIssue[] = [];
    const medicationIssues: MedicationIssue[] = [];
    const sameTypeIssues: MedicationIssue[] = [];

    for (const [name, med] of medicationMap) {
      const riskLevel = med.totalDays > 365 ? 'high' : 
                        med.issues.length > 0 ? 'medium' : 'low';
      
      // 累计超365天问题
      if (med.totalDays > 365) {
        medicationIssues.push({
          type: 'EXCEEDS_365_DAYS',
          severity: 'error',
          message: `累计${Math.round(med.totalDays)}天，超过1年用量`,
          details: { medication: name, days: Math.round(med.totalDays) }
        });
      }

      medications.push({
        name,
        totalDays: Math.round(med.totalDays),
        prescriptionCount: med.prescriptions.length,
        issues: med.issues,
        riskLevel
      });

      allIssues.push(...med.issues);
    }

    // 同剂量药品超量
    for (const [dose, group] of doseGroupMap) {
      if (group.totalDays > 365 && group.medications.length > 1) {
        sameTypeIssues.push({
          type: 'SAME_DOSE_EXCEEDS_365',
          severity: 'error',
          message: `同剂量(${dose})药品累计${Math.round(group.totalDays)}天，超过1年用量`,
          details: { medications: group.medications, days: Math.round(group.totalDays) }
        });
      }
    }

    // 医生用药统计
    const doctorAnalysis = Array.from(doctorStats.entries())
      .map(([name, stats]) => ({
        name,
        prescriptionCount: stats.count,
        medicationCount: stats.medications.size,
        riskLevel: stats.count > 50 ? 'high' : stats.count > 20 ? 'medium' : 'low'
      }))
      .sort((a, b) => b.prescriptionCount - a.prescriptionCount);

    // 科室用药统计
    const deptAnalysis = Array.from(deptStats.entries())
      .map(([name, stats]) => ({
        name,
        prescriptionCount: stats.count,
        medicationCount: stats.medications.size,
        riskLevel: stats.count > 100 ? 'high' : stats.count > 50 ? 'medium' : 'low'
      }))
      .sort((a, b) => b.prescriptionCount - a.prescriptionCount);

    // 计算风险评分 (0-100)
    const highRiskCount = medications.filter(m => m.riskLevel === 'high').length;
    const mediumRiskCount = medications.filter(m => m.riskLevel === 'medium').length;
    const riskScore = Math.min(100, highRiskCount * 30 + mediumRiskCount * 10);

    // 风险等级
    let riskLevel: 'high' | 'medium' | 'low' = 'low';
    if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 30) riskLevel = 'medium';

    return NextResponse.json({
      success: true,
      data: {
        patientInfo: {
          name: patient.Xm,
          gender: patient.Xb,
          age: patient.Csny ? Math.floor((new Date().getFullYear() - new Date(patient.Csny).getFullYear())) : null,
          zlh: zlh,
          analysisRange: {
            from: oneYearAgoStr,
            to: patient.zdrq?.toISOString?.()?.split('T')[0] || new Date().toISOString().split('T')[0]
          },
          visitCount: visitsResult.recordset.length,
          prescriptionCount: prescriptionsResult.recordset.length,
          currentDoctor: patient.doctor_name?.trim() || '-',
          currentDept: patient.dept_name?.trim() || '-'
        },
        medications,
        medicationIssues,
        sameTypeIssues,
        doctorAnalysis: doctorAnalysis.slice(0, 10),
        deptAnalysis: deptAnalysis.slice(0, 10),
        summary: {
          totalMedications: medications.length,
          highRiskCount,
          mediumRiskCount,
          lowRiskCount: medications.length - highRiskCount - mediumRiskCount,
          riskScore,
          riskLevel,
          totalIssues: allIssues.length + medicationIssues.length + sameTypeIssues.length
        },
        recommendations: generateRecommendations(medications, medicationIssues, sameTypeIssues, riskScore)
      }
    });

  } catch (error) {
    console.error('Medication analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '分析失败: ' + (error instanceof Error ? error.message : String(error))
    });
  }
}

function generateRecommendations(
  medications: MedicationSummary[],
  medicationIssues: MedicationIssue[],
  sameTypeIssues: MedicationIssue[],
  riskScore: number
): string[] {
  const recommendations: string[] = [];

  if (riskScore >= 60) {
    recommendations.push('⚠️ 该患者用药风险较高，建议进行用药审核');
  }

  if (medicationIssues.length > 0) {
    recommendations.push(`📋 发现${medicationIssues.length}种药品累计用量超过365天，需重点审核`);
  }

  if (sameTypeIssues.length > 0) {
    recommendations.push(`💊 发现${sameTypeIssues.length}组同剂量药品累计超量，注意重复用药`);
  }

  const shortDuration = medications.filter(m => 
    m.issues.some(i => i.type === 'SHORT_DURATION')
  );
  if (shortDuration.length > 0) {
    recommendations.push(`⏰ ${shortDuration.length}种药品单次疗程偏短，可能影响疗效`);
  }

  const doseIssues = medications.filter(m =>
    m.issues.some(i => i.type === 'DOSE_UNIT_ISSUE' || i.type === 'ABNORMAL_LOW_DOSE')
  );
  if (doseIssues.length > 0) {
    recommendations.push(`🔍 ${doseIssues.length}种药品剂量数据异常，请核实单位是否正确`);
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ 用药情况总体正常，未发现明显问题');
  }

  return recommendations;
}
