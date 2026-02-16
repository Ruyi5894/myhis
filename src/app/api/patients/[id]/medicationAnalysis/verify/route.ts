import { NextResponse } from 'next/server';
import sql from 'mssql';

const config = {
  server: '192.168.1.243',
  database: 'myhis',
  user: 'sa',
  password: 'RfVbGtUjM,Ki',
  options: { encrypt: false, trustServerCertificate: true }
};

async function verifyWithOllama(medications: any[]): Promise<any[]> {
  const questionable = medications.filter(m => 
    m.totalDays < 1 || m.totalDays > 90 || m.hasAbnormalDose
  );
  
  if (questionable.length === 0) return [];

  let medText = '';
  for (const med of questionable) {
    medText += `- 药品: ${med.name}\n  规格: ${med.spec}\n  剂量: ${med.jl}mg\n  用法: ${med.usage}\n  用量: ${med.dose}mg\n  数量: ${med.quantity}\n  计算天数: ${med.days}天\n\n`;
  }

  const prompt = `你是一位资深临床药师，请分析以下处方中用药天数的合理性：

${medText}

请逐个分析每个药品的计算是否正确。如果有问题，请给出正确天数。
回复格式（JSON数组）：
[
  {"medication": "药品名", "isCorrect": true/false, "issue": "问题描述", "correctDays": 正确天数, "reason": "理由"}
]`;

  try {
    const response = await fetch('http://192.168.1.243:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:7b-instruct',
        prompt: prompt,
        stream: false,
        options: { temperature: 0.1 }
      })
    });
    
    const data = await response.json();
    const result = data.response || '';
    
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) { console.error('Parse error:', e); }
    return [];
  } catch (error) {
    console.error('Ollama error:', error);
    return [];
  }
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

  try {
    const pool = await sql.connect(config);
    
    const patientResult = await pool.request()
      .input('zlh', sql.Int, zlh)
      .query(`
        SELECT TOP 1 jbxxbh, zdrq, p.Xm 
        FROM MZYSZ_YSZDK y
        LEFT JOIN XT_BRJBXXK p ON y.jbxxbh = p.Jbxxbh
        WHERE y.zlh = @zlh 
        ORDER BY y.zdrq ASC
      `);
    
    if (patientResult.recordset.length === 0) {
      return NextResponse.json({ success: false, error: '未找到患者' });
    }
    
    const patient = patientResult.recordset[0];
    const oneYearAgo = new Date(patient.zdrq);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const rxResult = await pool.request()
      .input('jbxxbh', sql.Int, patient.jbxxbh)
      .input('oneYearAgo', sql.DateTime, oneYearAgo)
      .query(`
        SELECT 
          m.cfxmmc as name,
          m.Mzgg as spec,
          m.jl as jl,
          m.ypsypldm as usage,
          m.ypyl as dose,
          m.sl as quantity
        FROM MZYSZ_CFK cf
        INNER JOIN MZYSZ_CFMXK m ON cf.CFxh = m.CFxh
        WHERE cf.brzlh IN (
          SELECT zlh FROM MZYSZ_YSZDK 
          WHERE jbxxbh = @jbxxbh AND zdrq >= @oneYearAgo
        )
        AND (m.sl < 3 OR m.sl > 90 OR m.ypyl < 1 OR m.ypyl > 1000 OR m.jl IS NULL OR m.jl = 0)
      `);

    const medications: any[] = [];
    for (const rx of rxResult.recordset) {
      const sl = parseFloat(rx.sl) || 0;
      const jl = parseFloat(rx.jl) || 0;
      const ypyl = parseFloat(rx.dose) || 0;
      const usage = (rx.usage || '').trim().toUpperCase();
      
      let timesPerDay = 1;
      if (usage.includes('BID') || usage === '2') timesPerDay = 2;
      else if (usage.includes('TID') || usage === '3') timesPerDay = 3;
      else if (usage.includes('QID') || usage === '4') timesPerDay = 4;
      
      let pillsPerBox = 1;
      const spec = rx.spec || '';
      const boxMatch = spec.match(/(\d+)\s*片/);
      if (boxMatch) pillsPerBox = parseInt(boxMatch[1], 10);
      
      const totalPills = sl * pillsPerBox;
      const days = totalPills / timesPerDay;
      const hasAbnormalDose = ypyl > 0 && jl > 0 && (ypyl / jl < 0.1 || ypyl / jl > 50);
      
      if (days < 1 || days > 90 || hasAbnormalDose || ypyl < 1 || ypyl > 1000) {
        medications.push({
          name: rx.name?.trim() || '未知',
          spec: spec,
          jl: jl,
          usage: usage,
          dose: ypyl,
          quantity: sl,
          totalDays: Math.round(days * 10) / 10,
          hasAbnormalDose
        });
      }
    }

    if (medications.length === 0) {
      return NextResponse.json({
        success: true,
        data: { hasQuestionable: false, message: '未发现可疑用药数据', verification: [] }
      });
    }

    const verification = await verifyWithOllama(medications);
    const issues = verification.filter((v: any) => !v.isCorrect);
    const hasDosageError = issues.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        hasQuestionable: medications.length > 0,
        questionableCount: medications.length,
        hasDosageError,
        medications,
        verification,
        conclusion: hasDosageError ? '发现用药数据异常，可能存在剂量单位错误' : '用药数据未发现明显异常',
        recommendation: hasDosageError ? '建议核查处方剂量单位是否正确' : '数据正常'
      }
    });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '验证失败: ' + (error instanceof Error ? error.message : String(error))
    });
  }
}
