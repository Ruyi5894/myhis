import { NextResponse } from 'next/server';
import sql from 'mssql';

const config = {
  server: '192.168.1.243',
  database: 'myhis',
  user: 'sa',
  password: 'RfVbGtUjM,Ki',
  options: { encrypt: false, trustServerCertificate: true }
};

// 调用 Ollama 进行用药分析
async function callOllama(prompt: string): Promise<string> {
  try {
    const response = await fetch('http://192.168.1.243:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:7b-instruct',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_ctx: 4096
        }
      })
    });
    
    const data = await response.json();
    return data.response || '';
  } catch (error) {
    console.error('Ollama call failed:', error);
    throw error;
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

  let pool: sql.ConnectionPool | null = null;
  
  try {
    pool = await sql.connect(config);
    
    // 获取患者信息
    const patientResult = await pool.request()
      .input('zlh', sql.Int, zlh)
      .query(`
        SELECT TOP 1 jbxxbh, zdrq, p.Xm, p.Xb, p.Csny 
        FROM MZYSZ_YSZDK y
        LEFT JOIN XT_BRJBXXK p ON y.jbxxbh = p.Jbxxbh
        WHERE y.zlh = @zlh 
        ORDER BY y.zdrq ASC
      `);
    
    if (patientResult.recordset.length === 0) {
      return NextResponse.json({ success: false, error: '未找到该患者' });
    }
    
    const patient = patientResult.recordset[0];
    const oneYearAgo = new Date(patient.zdrq);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // 获取1年内所有处方
    const prescriptionsResult = await pool.request()
      .input('jbxxbh', sql.Int, patient.jbxxbh)
      .input('oneYearAgo', sql.DateTime, oneYearAgo)
      .query(`
        SELECT 
          cf.cfxh,
          CONVERT(VARCHAR(10), cf.cfrq, 120) AS cfrq,
          m.cfxmmc,
          m.sl,
          m.jl,
          m.ypsypldm,
          m.ypyl,
          m.Mzgg
        FROM MZYSZ_CFK cf
        INNER JOIN MZYSZ_CFMXK m ON cf.CFxh = m.CFxh
        WHERE cf.brzlh IN (SELECT y2.zlh FROM MZYSZ_YSZDK y2 WHERE y2.jbxxbh = @jbxxbh AND y2.zdrq >= @oneYearAgo)
        ORDER BY cf.cfrq DESC
      `);
    
    // 构建用药记录文本
    let medText = '';
    for (const rx of prescriptionsResult.recordset) {
      const name = rx.cfxmmc?.trim() || '未知';
      const spec = rx.Mzgg?.trim() || '';
      const qty = rx.sl || 0;
      const usage = rx.ypsypldm?.trim() || '';
      const dose = rx.ypyl || 0;
      medText += `- ${name} ${spec} 数量:${qty} 用法:${usage} 用量:${dose}\n`;
    }
    
    // 构建AI分析提示词
    const aiPrompt = `你是一位资深临床药师，请分析以下患者的用药情况，找出可能存在的问题：

患者姓名：${patient.Xm}
就诊时间范围：${oneYearAgo.toISOString().split('T')[0]} 至 ${patient.zdrq?.toISOString?.()?.split('T')[0] || '现在'}

处方记录：
${medText || '无处方记录'}

请分析以下内容：
1. 是否有单次用药剂量异常（如过大或过小）
2. 是否有累计用药时间超过合理范围（如同一药品超过365天）
3. 是否有同类型药品重复使用
4. 是否有用药禁忌或相互作用风险
5. 其他需要关注的用药问题

请用中文回复，格式清晰，重点突出问题。如果没有问题，也请明确说明。`;

    // 调用AI分析
    const aiResult = await callOllama(aiPrompt);
    
    return NextResponse.json({
      success: true,
      data: {
        patient: {
          name: patient.Xm,
          zlh: zlh
        },
        summary: {
          totalPrescriptions: prescriptionsResult.recordset.length,
          analysisRange: {
            from: oneYearAgo.toISOString().split('T')[0],
            to: patient.zdrq?.toISOString?.()?.split('T')[0] || new Date().toISOString().split('T')[0]
          }
        },
        analysis: aiResult
      }
    });
    
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'AI分析失败: ' + (error instanceof Error ? error.message : String(error))
    });
  } finally {
    if (pool) {
      pool.close();
    }
  }
}
