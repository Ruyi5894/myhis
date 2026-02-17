// 药品规格数据库 - 用于计算可用天数
// 格式：{ 药品名称关键字: { 每盒单位数量, 单位类型 } }

export const DRUG_SPEC_DB: Record<string, {
  perBox: number;  // 每盒/瓶/支 含多少单位
  unit: string;    // 单位类型: 丸、片、粒、支、袋、ml 等
  perUnitMg?: number; // 每单位含多少mg（可选，用于进一步计算）
}> = {
  // 丸剂
  '麝香保心丸': { perBox: 42, unit: '丸' },
  '复方丹参滴丸': { perBox: 180, unit: '丸' },
  '银杏叶滴丸': { perBox: 80, unit: '丸' },
  '血塞通滴丸': { perBox: 90, unit: '丸' },
  '通脉滴丸': { perBox: 180, unit: '丸' },
  
  // 片剂
  '阿司匹林': { perBox: 30, unit: '片' },
  '布洛芬': { perBox: 20, unit: '片' },
  '头孢克洛': { perBox: 12, unit: '片' },
  '阿莫西林': { perBox: 24, unit: '片' },
  '氯雷他定': { perBox: 10, unit: '片' },
  '硝苯地平': { perBox: 30, unit: '片' },
  '二甲双胍': { perBox: 60, unit: '片' },
  '辛伐他汀': { perBox: 7, unit: '片' },
  '氨氯地平': { perBox: 7, unit: '片' },
  
  // 胶囊
  '复方甲氧那明': { perBox: 40, unit: '粒' },
  '沙库巴曲缬沙坦': { perBox: 14, unit: '片' },
  '富马酸比索洛尔': { perBox: 18, unit: '片' },
  '盐酸金霉素眼膏': { perBox: 1, unit: '支' },
  
  // 口服液/溶液
  '羧甲司坦口服溶液': { perBox: 10, unit: '支', perUnitMg: 0.5 }, // 10ml:0.5g 每支0.5g
  '氨溴索口服液': { perBox: 6, unit: '支' },
  '氯雷他定糖浆': { perBox: 60, unit: 'ml' },
  
  // 颗粒剂
  '感冒灵颗粒': { perBox: 9, unit: '袋' },
  '板蓝根颗粒': { perBox: 20, unit: '袋' },
  '连花清瘟颗粒': { perBox: 10, unit: '袋' },
};

// 从规格字符串中解析每盒单位数量
export function parseSpecFromString(spec: string): { perBox: number; unit: string } | null {
  if (!spec) return null;
  
  // 匹配 "数字+单位" 模式，如 "42丸", "30片", "10ml"
  const match = spec.match(/(\d+)\s*(丸|片|粒|支|袋|ml|毫升|mL|g|mg)/i);
  if (match) {
    return {
      perBox: parseInt(match[1], 10),
      unit: match[2]
    };
  }
  
  return null;
}

// 查找药品规格
export function findDrugSpec(medicationName: string): { perBox: number; unit: string } | null {
  if (!medicationName) return null;
  
  // 先精确匹配
  for (const [key, value] of Object.entries(DRUG_SPEC_DB)) {
    if (medicationName.includes(key)) {
      return { perBox: value.perBox, unit: value.unit };
    }
  }
  
  return null;
}
