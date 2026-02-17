#!/usr/bin/env node
/**
 * 直接调用Ollama批量分析药品规格 - 改进版
 */

const OLLAMA_URL = 'http://192.168.1.243:11434/api/generate';
const MODEL = 'deepseek-r1:7b';

// 药品列表
const drugs = [
  { name: '麝香保心丸', spec: '22.5mg×42丸/瓶' },
  { name: '复方丹参滴丸', spec: '27mg×180丸/瓶' },
  { name: '银杏叶滴丸', spec: '9.6mg×80丸/盒' },
  { name: '六味地黄丸', spec: '每8丸重1.44g' },
  { name: '安脑丸', spec: '3g(3g/11粒)×6丸/盒' },
  { name: '阿司匹林肠溶片', spec: '100mg×30片/盒' },
  { name: '苯磺酸氨氯地平片', spec: '5mg×28片/盒' },
  { name: '苯磺酸左旋氨氯地平片', spec: '2.5mg×28片/盒' },
  { name: '替米沙坦片', spec: '40mg×28片/盒' },
  { name: '厄贝沙坦氢氯噻嗪片', spec: '150mg/12.5mg×14片/瓶' },
  { name: '缬沙坦氨氯地平片', spec: '80mg/5mg×7片/盒' },
  { name: '缬沙坦氢氯噻嗪片', spec: '80mg/12.5mg×14片/盒' },
  { name: '二甲双胍缓释片', spec: '0.5g×30片/瓶' },
  { name: '格列美脲片', spec: '2mg×60片/盒' },
  { name: '阿托伐他汀钙片', spec: '20mg×7片/盒' },
  { name: '瑞舒伐他汀钙片', spec: '10mg×7片/盒' },
  { name: '阿卡波糖片', spec: '50mg×30片/盒' },
  { name: '富马酸比索洛尔片', spec: '5mg×10片/盒' },
  { name: '美托洛尔片', spec: '25mg×20片/盒' },
  { name: '琥珀酸美托洛尔缓释片', spec: '47.5mg×100片/瓶' },
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

async function callOllama(prompt) {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false
    })
  });
  
  const result = await response.json();
  return result.response;
}

function parseResponse(response) {
  // 尝试提取数字
  const match = response.match(/(\d+)\s*(丸|片|粒|支|袋|颗)/);
  if (match) {
    return { perBox: parseInt(match[1]), unit: match[2] };
  }
  
  // 尝试解析JSON
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      // 确保perBox是数字
      if (parsed.perBox) {
        parsed.perBox = parseInt(String(parsed.perBox).replace(/\D/g, ''));
        return parsed;
      }
    } catch (e) {}
  }
  
  return null;
}

async function analyzeDrug(drug) {
  // 改进提示词，明确要求只返回数字
  const prompt = `从药品规格提取信息。
规格: ${drug.spec}
例如: "22.5mg×42丸/瓶" 表示每瓶42丸
返回格式(只返回数字): perBox=42, unit=丸`;

  try {
    const response = await callOllama(prompt);
    const result = parseResponse(response);
    
    if (result && result.perBox) {
      return result;
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
  
  return null;
}

async function main() {
  console.log(`开始分析 ${drugs.length} 个药品...\n`);
  
  const results = [];
  
  for (let i = 0; i < drugs.length; i++) {
    const drug = drugs[i];
    console.log(`[${i+1}/${drugs.length}] ${drug.name}: ${drug.spec}`);
    
    const result = await analyzeDrug(drug);
    
    if (result) {
      results.push({
        name: drug.name,
        perBox: result.perBox,
        unit: result.unit
      });
      console.log(`  => ${result.perBox} ${result.unit}`);
    } else {
      console.log(`  => 解析失败`);
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('\n========== 结果 ==========');
  for (const r of results) {
    console.log(`  '${r.name}': { perBox: ${r.perBox}, unit: '${r.unit}' },`);
  }
}

main().catch(console.error);
