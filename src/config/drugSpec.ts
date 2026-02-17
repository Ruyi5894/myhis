// 药品规格数据库 - 完整版（基于AI分析和已知数据）
// 用于计算可用天数

export const DRUG_SPEC_DB: Record<string, {
  perBox: number;  // 每盒/瓶/支 含多少单位
  unit: string;   // 单位类型: 丸、片、粒、支、袋、ml 等
  source?: string; // 数据来源
}> = {
  // ========== 丸剂 ==========
  '麝香保心丸': { perBox: 42, unit: '丸', source: 'ai' },
  '复方丹参滴丸': { perBox: 180, unit: '丸', source: 'ai' },
  '银杏叶滴丸': { perBox: 80, unit: '丸', source: 'ai' },
  '六味地黄丸': { perBox: 360, unit: '丸', source: 'calculated' },
  '安脑丸': { perBox: 6, unit: '丸', source: 'ai' },
  '芪苈强心胶囊': { perBox: 36, unit: '粒', source: 'known' },
  
  // ========== 片剂 ==========
  '阿司匹林': { perBox: 30, unit: '片', source: 'known' },
  '阿司匹林肠溶片': { perBox: 30, unit: '片', source: 'ai' },
  '布洛芬': { perBox: 20, unit: '片', source: 'known' },
  '头孢克洛': { perBox: 12, unit: '片', source: 'known' },
  '阿莫西林': { perBox: 24, unit: '片', source: 'known' },
  '氯雷他定': { perBox: 10, unit: '片', source: 'known' },
  '氯雷他定片': { perBox: 6, unit: '片', source: 'known' },
  '硝苯地平': { perBox: 30, unit: '片', source: 'known' },
  '二甲双胍': { perBox: 60, unit: '片', source: 'known' },
  '二甲双胍缓释片': { perBox: 30, unit: '片', source: 'ai' },
  '格列美脲': { perBox: 60, unit: '片', source: 'known' },
  '辛伐他汀': { perBox: 7, unit: '片', source: 'known' },
  '氨氯地平': { perBox: 7, unit: '片', source: 'known' },
  '苯磺酸氨氯地平': { perBox: 28, unit: '片', source: 'ai' },
  '苯磺酸左旋氨氯地平': { perBox: 28, unit: '片', source: 'ai' },
  '替米沙坦': { perBox: 28, unit: '片', source: 'ai' },
  '厄贝沙坦': { perBox: 14, unit: '片', source: 'known' },
  '厄贝沙坦氢氯噻嗪': { perBox: 14, unit: '片', source: 'ai' },
  '缬沙坦': { perBox: 7, unit: '片', source: 'known' },
  '缬沙坦氨氯地平': { perBox: 7, unit: '片', source: 'ai' },
  '缬沙坦氢氯噻嗪': { perBox: 14, unit: '片', source: 'ai' },
  '培哚普利': { perBox: 10, unit: '片', source: 'known' },
  '富马酸比索洛尔': { perBox: 10, unit: '片', source: 'known' },
  '美托洛尔': { perBox: 20, unit: '片', source: 'ai' },
  '琥珀酸美托洛尔': { perBox: 100, unit: '片', source: 'ai' },
  '阿托伐他汀': { perBox: 7, unit: '片', source: 'ai' },
  '瑞舒伐他汀': { perBox: 7, unit: '片', source: 'ai' },
  '匹伐他汀': { perBox: 7, unit: '片', source: 'ai' },
  '阿卡波糖': { perBox: 30, unit: '片', source: 'ai' },
  '伏格列波糖': { perBox: 30, unit: '片', source: 'known' },
  '西格列汀': { perBox: 30, unit: '片', source: 'known' },
  '沙格列汀': { perBox: 14, unit: '片', source: 'known' },
  '利格列汀': { perBox: 14, unit: '片', source: 'known' },
  '格列齐特': { perBox: 60, unit: '片', source: 'known' },
  '格列吡嗪': { perBox: 30, unit: '片', source: 'known' },
  '金水宝': { perBox: 36, unit: '片', source: 'known' },
  '心可舒': { perBox: 72, unit: '片', source: 'known' },
  '心可舒胶囊': { perBox: 72, unit: '粒', source: 'known' },
  '复方血栓通': { perBox: 36, unit: '片', source: 'known' },
  '银杏叶片': { perBox: 96, unit: '片', source: 'known' },
  '雷贝拉唑': { perBox: 10, unit: '片', source: 'known' },
  '艾司奥美拉唑': { perBox: 7, unit: '片', source: 'known' },
  '艾普拉唑': { perBox: 10, unit: '片', source: 'known' },
  '阿法骨化醇': { perBox: 20, unit: '粒', source: 'known' },
  '阿仑膦酸钠': { perBox: 6, unit: '片', source: 'known' },
  '阿奇霉素': { perBox: 6, unit: '片', source: 'known' },
  '阿昔洛韦': { perBox: 24, unit: '片', source: 'known' },
  '阿普唑仑': { perBox: 24, unit: '片', source: 'known' },
  '艾司唑仑': { perBox: 30, unit: '片', source: 'known' },
  '维生素B1': { perBox: 100, unit: '片', source: 'known' },
  '维生素B2': { perBox: 100, unit: '片', source: 'known' },
  '维生素C': { perBox: 100, unit: '片', source: 'known' },
  '维生素A': { perBox: 100, unit: '粒', source: 'known' },
  
  // ========== 胶囊 ==========
  '复方甲氧那明': { perBox: 40, unit: '粒', source: 'ai' },
  '沙库巴曲缬沙坦': { perBox: 14, unit: '片', source: 'known' },
  '双氯芬酸钠': { perBox: 10, unit: '粒', source: 'known' },
  '阿莫西林克拉维酸钾': { perBox: 12, unit: '片', source: 'known' },
  '桉柠蒎': { perBox: 36, unit: '粒', source: 'ai' },
  '阿昔莫司': { perBox: 24, unit: '粒', source: 'known' },
  '头孢克肟': { perBox: 10, unit: '粒', source: 'known' },
  '诺氟沙星': { perBox: 24, unit: '粒', source: 'known' },
  '铝碳酸镁': { perBox: 48, unit: '片', source: 'known' },
  
  // ========== 口服液/溶液 ==========
  '羧甲司坦口服溶液': { perBox: 10, unit: '支', source: 'ai' },
  '氨溴索口服液': { perBox: 6, unit: '支', source: 'known' },
  '氯雷他定糖浆': { perBox: 1, unit: '瓶', source: 'known' },
  '双黄连口服液': { perBox: 12, unit: '支', source: 'ai' },
  '生脉饮': { perBox: 10, unit: '支', source: 'known' },
  '安神补脑液': { perBox: 10, unit: '支', source: 'ai' },
  '爱维心口服液': { perBox: 4, unit: '支', source: 'known' },
  '对乙酰氨基酚混悬液': { perBox: 1, unit: '瓶', source: 'known' },
  '布洛芬混悬液': { perBox: 1, unit: '瓶', source: 'known' },
  
  // ========== 颗粒剂 ==========
  '感冒灵颗粒': { perBox: 9, unit: '袋', source: 'ai' },
  '板蓝根颗粒': { perBox: 20, unit: '袋', source: 'ai' },
  '连花清瘟颗粒': { perBox: 10, unit: '袋', source: 'known' },
  '阿莫西林颗粒': { perBox: 24, unit: '袋', source: 'known' },
  '阿奇霉素颗粒': { perBox: 3, unit: '袋', source: 'known' },
  '头孢克洛颗粒': { perBox: 12, unit: '袋', source: 'known' },
  '蒙脱石散': { perBox: 10, unit: '袋', source: 'known' },
  
  // ========== 注射剂 ==========
  '胰岛素': { perBox: 1, unit: '支', source: 'known' },
  '甘精胰岛素': { perBox: 1, unit: '支', source: 'ai' },
  '精蛋白人胰岛素': { perBox: 1, unit: '支', source: 'known' },
  '地塞米松': { perBox: 1, unit: '支', source: 'ai' },
  '呋塞米': { perBox: 1, unit: '支', source: 'ai' },
  '多巴胺': { perBox: 1, unit: '支', source: 'known' },
  '阿托品': { perBox: 1, unit: '支', source: 'known' },
  '倍他司汀': { perBox: 1, unit: '支', source: 'known' },
  '长春西汀': { perBox: 6, unit: '支', source: 'known' },
  '玻璃酸钠滴眼液': { perBox: 1, unit: '支', source: 'known' },
  '妥布霉素地塞米松滴眼液': { perBox: 1, unit: '支', source: 'known' },
  '左氧氟沙星滴眼液': { perBox: 1, unit: '支', source: 'known' },
  '布林佐胺滴眼液': { perBox: 1, unit: '支', source: 'known' },
  
  // ========== 输液 ==========
  '氯化钠注射液': { perBox: 1, unit: '瓶', source: 'known' },
  '葡萄糖注射液': { perBox: 1, unit: '瓶', source: 'known' },
  '葡萄糖氯化钠': { perBox: 1, unit: '瓶', source: 'known' },
  '葡萄糖酸钙': { perBox: 1, unit: '支', source: 'known' },
  
  // ========== 外用 ==========
  '开塞露': { perBox: 2, unit: '支', source: 'known' },
  '乳膏': { perBox: 1, unit: '支', source: 'known' },
  '软膏': { perBox: 1, unit: '支', source: 'known' },
  '滴眼液': { perBox: 1, unit: '支', source: 'known' },
  '碘伏': { perBox: 1, unit: '瓶', source: 'known' },
  '酒精': { perBox: 1, unit: '瓶', source: 'known' },
};

// 从规格字符串解析
export function parseSpecFromString(spec: string): { perBox: number; unit: string } | null {
  if (!spec) return null;
  
  // 匹配 "数字×数字单位/盒" 格式
  let match = spec.match(/(\d+)\s*[×*]\s*(\d+)\s*(片|丸|粒|支|袋|颗)/);
  if (match) {
    return { perBox: parseInt(match[1]) * parseInt(match[2]), unit: match[3] };
  }
  
  // 匹配 "数字单位/盒" 格式
  match = spec.match(/(\d+)\s*(片|丸|粒|支|袋|颗|ml|毫升|mL)\s*[\/盒瓶袋]/i);
  if (match) {
    return { perBox: parseInt(match[1]), unit: match[2] };
  }
  
  return null;
}

// 查找药品规格
export function findDrugSpec(medicationName: string): { perBox: number; unit: string } | null {
  if (!medicationName) return null;
  const name = medicationName.trim();
  
  for (const [key, value] of Object.entries(DRUG_SPEC_DB)) {
    if (name.includes(key)) {
      return { perBox: value.perBox, unit: value.unit };
    }
  }
  return null;
}

// 智能解析规格
export function smartParseSpec(medicationName: string, spec: string): { perBox: number; unit: string } | null {
  const localSpec = findDrugSpec(medicationName);
  if (localSpec) return localSpec;
  return parseSpecFromString(spec);
}
