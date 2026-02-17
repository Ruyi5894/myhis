#!/usr/bin/env node
/**
 * 药品规格AI分析脚本
 * 用法: node scripts/analyze-drugs.js
 * 
 * 分析药品规格并生成可用于计算天数的配置
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://192.168.1.243:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3-vl:8b';

// 常用药品列表（从HIS系统获取）
const DRUGS_TO_ANALYZE = [
  { name: '麝香保心丸', spec: '22.5mg×42丸/瓶' },
  { name: '复方丹参滴丸', spec: '27mg×180丸/瓶' },
  { name: '银杏叶滴丸', spec: '9.6mg×80丸/盒' },
  { name: '六味地黄丸', spec: '每8丸重1.44g' },
  { name: '阿司匹林肠溶片', spec: '100mg×30片/盒' },
  { name: '苯磺酸氨氯地平片', spec: '5mg×28片/盒' },
  { name: '替米沙坦片', spec: '40mg×28片/盒' },
  { name: '厄贝沙坦氢氯噻嗪片', spec: '150mg/12.5mg×14片/瓶' },
  { name: '缬沙坦氨氯地平片', spec: '80mg/5mg×7片/盒' },
  { name: '二甲双胍缓释片', spec: '0.5g×30片/瓶' },
  { name: '格列美脲片', spec: '2mg×60片/盒' },
  { name: '阿托伐他汀钙片', spec: '20mg×7片/盒' },
  { name: '瑞舒伐他汀钙片', spec: '10mg×7片/盒' },
  { name: '阿卡波糖片', spec: '50mg×30片/盒' },
  { name: '富马酸比索洛尔片', spec: '5mg×10片/盒' },
  { name: '美托洛尔片', spec: '25mg×20片/盒' },
  { name: '琥珀酸美托洛尔缓释片', spec: '95mg×100片/瓶' },
  { name: '复方甲氧那明胶囊', spec: '12.5mg×40粒/盒' },
  { name: '头孢克洛缓释胶囊', spec: '187.5mg×12粒/盒' },
  { name: '桉柠蒎肠溶胶囊', spec: '0.3g×36粒/盒' },
  { name: '阿法骨化醇软胶囊', spec: '0.25ug×20粒/盒' },
  { name: '羧甲司坦口服溶液', spec: '10ml:0.5g×10支/盒' },
  { name: '双黄连口服液', spec: '10ml×12支/盒' },
  { name: '安神补脑液', spec: '10ml×10支/盒' },
  { name: '感冒灵颗粒', spec: '10g×9袋/盒' },
  { name: '板蓝根颗粒', spec: '10g×20袋/盒' },
  { name: '甘精胰岛素注射液', spec: '3ml:300单位/支' },
  { name: '地塞米松磷酸钠注射液', spec: '1ml/支' },
  { name: '呋塞米注射液', spec: '2ml:20mg/支' },
];

async function analyzeDrug(name, spec) {
  const prompt = `分析以下药品规格，返回JSON格式：
药品名称：${name}
规格：${spec}

返回格式：
{
  "perBox": 数字（每盒/瓶含多少单位）,
  "unit": "单位（丸、片、粒、支、袋等）",
  "note": "说明"
}
只返回JSON。`;

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false
      })
    });

    const result = await response.json();
    const jsonMatch = result.response?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error(`分析失败: ${name}`, e.message);
  }
  return null;
}

async function main() {
  console.log(`开始分析 ${DRUGS_TO_ANALYZE.length} 个药品...\n`);
  
  const results = [];
  
  for (let i = 0; i < DRUGS_TO_ANALYZE.length; i++) {
    const drug = DRUGS_TO_ANALYZE[i];
    console.log(`[${i+1}/${DRUGS_TO_ANALYZE.length}] 分析: ${drug.name} - ${drug.spec}`);
    
    const analysis = await analyzeDrug(drug.name, drug.spec);
    
    if (analysis) {
      results.push({
        name: drug.name,
        spec: drug.spec,
        ...analysis
      });
      console.log(`  -> 结果: ${analysis.perBox}${analysis.unit}`);
    } else {
      console.log(`  -> 分析失败`);
    }
    
    // 避免请求过快
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('\n========== 分析结果 ==========');
  console.log(JSON.stringify(results, null, 2));
  
  // 生成代码
  console.log('\n========== 生成配置代码 ==========');
  console.log("  // 新增药品规格");
  for (const r of results) {
    if (r.perBox && r.unit) {
      console.log(`  '${r.name}': { perBox: ${r.perBox}, unit: '${r.unit}' },`);
    }
  }
}

main().catch(console.error);
