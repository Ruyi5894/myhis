#!/usr/bin/env node
/**
 * 批量分析药品规格
 */

const API_URL = 'http://localhost:3000/api/drugs/analyze';

// 获取药品列表
async function getDrugs() {
  const res = await fetch('http://localhost:3000/api/drugs/analyze');
  const data = await res.json();
  return data.drugs;
}

// 分析单个药品
async function analyzeDrug(name, spec) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, spec })
  });
  const data = await res.json();
  return data.data;
}

async function main() {
  console.log('获取药品列表...');
  const drugs = await getDrugs();
  console.log(`共 ${drugs.length} 个药品\n`);

  const results = [];
  
  for (let i = 0; i < drugs.length; i++) {
    const drug = drugs[i];
    console.log(`[${i+1}/${drugs.length}] 分析: ${drug.name} - ${drug.spec}`);
    
    try {
      const result = await analyzeDrug(drug.name, drug.spec);
      if (result) {
        results.push({
          name: drug.name,
          spec: drug.spec,
          perBox: result.perBox,
          unit: result.unit
        });
        console.log(`  => ${result.perBox} ${result.unit}`);
      }
    } catch (e) {
      console.log(`  => 失败: ${e.message}`);
    }
    
    // 避免过快
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n========== 结果 ==========');
  
  // 输出配置代码
  console.log('\n// 药品规格数据库');
  for (const r of results) {
    if (r.perBox && r.unit) {
      console.log(`  '${r.name}': { perBox: ${r.perBox}, unit: '${r.unit}', source: 'ai' },`);
    }
  }
  
  console.log('\n========== JSON结果 ==========');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
