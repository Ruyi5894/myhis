import { NextResponse } from 'next/server';
import sql from 'mssql';

const config = {
  server: '192.168.1.243',
  database: 'myhis',
  user: 'sa',
  password: 'RfVbGtUjM,Ki',
  options: { encrypt: false, trustServerCertificate: true }
};

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
    
    // Get patient's first visit date to determine 1-year range
    const patientResult = await pool.request()
      .input('zlh', sql.Int, zlh)
      .query(`
        SELECT TOP 1 jbxxbh, zdrq 
        FROM MZYSZ_YSZDK 
        WHERE zlh = @zlh 
        ORDER BY zdrq ASC
      `);
    
    if (patientResult.recordset.length === 0) {
      return NextResponse.json({ success: false, error: '未找到该患者' });
    }
    
    const patientInfo = patientResult.recordset[0];
    const oneYearAgo = new Date(patientInfo.zdrq);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
    
    // Get all visits and prescriptions for this patient in the past year
    const visitsResult = await pool.request()
      .input('jbxxbh', sql.Int, patientInfo.jbxxbh)
      .input('oneYearAgo', sql.DateTime, oneYearAgo)
      .query(`
        SELECT 
          y.zlh, y.zdrq, k.Ksmc AS dept_name, doc.zgxm AS doctor_name
        FROM MZYSZ_YSZDK y
        LEFT JOIN GH_MXXXK g ON y.zlh = g.zlh
        LEFT JOIN JB_KSBMK k ON g.Ksdm = k.Ksdm
        LEFT JOIN YBsjcj_JB_ZGBMK doc ON y.Zdys = doc.zgdm
        WHERE y.jbxxbh = @jbxxbh AND y.zdrq >= @oneYearAgo
        ORDER BY y.zdrq DESC
      `);
    
    // Get all prescriptions in the past year
    const prescriptionsResult = await pool.request()
      .input('jbxxbh', sql.Int, patientInfo.jbxxbh)
      .input('oneYearAgo', sql.DateTime, oneYearAgo)
      .query(`
        SELECT 
          cf.cfxh,
          CONVERT(VARCHAR(10), cf.cfrq, 120) AS cfrq,
          m.cfxmmc,
          m.sl,
          m.jl,
          m.ypyf,
          m.ypsypldm,
          m.ypyl,
          m.Mzgg
        FROM MZYSZ_CFK cf
        INNER JOIN MZYSZ_CFMXK m ON cf.CFxh = m.CFxh
        WHERE cf.brzlh IN (SELECT zlh FROM MZYSZ_YSZDK WHERE jbxxbh = @jbxxbh AND zdrq >= @oneYearAgo)
        ORDER BY cf.cfrq DESC, m.cfxmmc
      `);
    
    // Calculate days for each prescription and aggregate by medication
    const medicationMap = new Map();
    const medicationIssues: any[] = [];
    const sameTypeIssues: any[] = [];
    
    // Group prescriptions by medication name (simple grouping by cfxmmc)
    for (const rx of prescriptionsResult.recordset) {
      const sl = parseFloat(rx.sl) || 0;
      const ypyf = rx.ypsypldm?.trim().toUpperCase() || '';
      const jl = parseFloat(rx.jl) || 0;
      const mzgg = rx.Mzgg || '';
      
      // Skip if cannot calculate
      if (!sl || !jl || ypyf === 'PRN' || ypyf === 'SOS' || ypyf === 'ST') {
        continue;
      }
      
      // Parse pills per box from Mzgg
      let pillsPerBox = 1;
      const boxMatch = mzgg.match(/(\d+)\s*片/);
      if (boxMatch) {
        pillsPerBox = parseInt(boxMatch[1], 10);
      }
      
      // Calculate days for this prescription
      let timesPerDay = 1;
      if (ypyf.includes('QD') || ypyf === '1' || ypyf === 'QN') timesPerDay = 1;
      else if (ypyf.includes('BID') || ypyf === '2') timesPerDay = 2;
      else if (ypyf.includes('TID') || ypyf === '3') timesPerDay = 3;
      else if (ypyf.includes('QID') || ypyf === '4') timesPerDay = 4;
      
      const totalPills = sl * pillsPerBox;
      const days = totalPills / timesPerDay;
      
      const medName = rx.cfxmmc?.trim() || '未知药品';
      
      if (!medicationMap.has(medName)) {
        medicationMap.set(medName, {
          name: medName,
          totalDays: 0,
          prescriptions: [],
          jl: jl,
          issues: []
        });
      }
      
      const med = medicationMap.get(medName);
      med.totalDays += days;
      med.prescriptions.push({
        date: rx.cfrq,
        sl: sl,
        pillsPerBox: pillsPerBox,
        ypyf: ypyf,
        days: Math.round(days),
        ypyl: rx.ypyl
      });
      
      // Check for issues per prescription
      if (days < 3 && days > 0) {
        med.issues.push({
          type: 'SHORT_DURATION',
          severity: 'warning',
          message: `单次开具${Math.round(days)}天，可能不足一个疗程`,
          date: rx.cfrq
        });
      } else if (days > 90) {
        med.issues.push({
          type: 'LONG_DURATION',
          severity: 'warning',
          message: `单次开具${Math.round(days)}天，超过常规用量`,
          date: rx.cfrq
        });
      }
    }
    
    // Analyze issues
    const allMedications = Array.from(medicationMap.values());
    
    // Check total days per medication
    for (const med of allMedications) {
      if (med.totalDays > 365) {
        medicationIssues.push({
          medication: med.name,
          totalDays: Math.round(med.totalDays),
          severity: 'error',
          message: `累计用药${Math.round(med.totalDays)}天，超过1年用量`
        });
      }
    }
    
    // Check same-type medications (simplified: same JL, similar names)
    // Group by JL (dose) as a proxy for medication type
    const doseGroupMap = new Map();
    for (const med of allMedications) {
      const doseKey = `${med.jl}mg`;
      if (!doseGroupMap.has(doseKey)) {
        doseGroupMap.set(doseKey, {
          dose: med.jl,
          medications: [],
          totalDays: 0
        });
      }
      const group = doseGroupMap.get(doseKey);
      group.medications.push(med.name);
      group.totalDays += med.totalDays;
    }
    
    for (const [dose, group] of doseGroupMap) {
      if (group.totalDays > 365 && group.medications.length > 1) {
        sameTypeIssues.push({
          dose: dose,
          medications: group.medications,
          totalDays: Math.round(group.totalDays),
          severity: 'error',
          message: `同剂量(${dose})药品累计${Math.round(group.totalDays)}天，超过1年用量`
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        patientInfo: {
          zlh: zlh,
          analysisRange: {
            from: oneYearAgoStr,
            to: patientInfo.zdrq?.toISOString?.()?.split('T')[0] || new Date().toISOString().split('T')[0]
          },
          visitCount: visitsResult.recordset.length,
          prescriptionCount: prescriptionsResult.recordset.length
        },
        visits: visitsResult.recordset,
        medications: allMedications.map(m => ({
          name: m.name,
          totalDays: Math.round(m.totalDays),
          prescriptionCount: m.prescriptions.length,
          issues: m.issues
        })),
        medicationIssues,
        sameTypeIssues,
        summary: {
          totalMedications: allMedications.length,
          medicationsWithIssues: allMedications.filter(m => m.issues.length > 0).length,
          medicationsOver365: medicationIssues.length,
          sameTypeOver365: sameTypeIssues.length
        }
      }
    });
    
  } catch (error) {
    console.error('Medication analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '分析失败: ' + (error instanceof Error ? error.message : String(error))
    });
  } finally {
    if (pool) {
      pool.close();
    }
  }
}
