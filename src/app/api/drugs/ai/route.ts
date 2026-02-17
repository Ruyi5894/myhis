import { NextResponse } from 'next/server';

// 从本地数据库读取所有药品
const DRUGS_DB = [
  // 丸剂
  { name: '麝香保心丸', spec: '22.5mg×42丸/瓶', perBox: 42, unit: '丸', dosePerUnit: 22.5, defaultDose: 45, defaultUnit: 'mg' },
  { name: '复方丹参滴丸', spec: '27mg×180丸/瓶', perBox: 180, unit: '丸', dosePerUnit: 27, defaultDose: 30, defaultUnit: '丸' },
  { name: '银杏叶滴丸', spec: '9.6mg×80丸/盒', perBox: 80, unit: '丸', dosePerUnit: 9.6, defaultDose: 3, defaultUnit: '丸' },
  { name: '六味地黄丸', spec: '360丸/瓶', perBox: 360, unit: '丸', defaultDose: 8, defaultUnit: '丸' },
  { name: '安脑丸', spec: '3g×6丸/盒', perBox: 6, unit: '丸', defaultDose: 2, defaultUnit: '丸' },
  { name: '血塞通滴丸', spec: '90丸/盒', perBox: 90, unit: '丸', defaultDose: 3, defaultUnit: '丸' },
  { name: '通脉滴丸', spec: '180丸/瓶', perBox: 180, unit: '丸', defaultDose: 30, defaultUnit: '丸' },
  { name: '中风回春片', spec: '36片/盒', perBox: 36, unit: '片', defaultDose: 4, defaultUnit: '片' },
  { name: '金匮肾气丸', spec: '360丸/瓶', perBox: 360, unit: '丸', defaultDose: 8, defaultUnit: '丸' },
  { name: '知柏地黄丸', spec: '360丸/瓶', perBox: 360, unit: '丸', defaultDose: 8, defaultUnit: '丸' },
  { name: '杞菊地黄丸', spec: '360丸/瓶', perBox: 360, unit: '丸', defaultDose: 8, defaultUnit: '丸' },
  { name: '桂附地黄丸', spec: '360丸/瓶', perBox: 360, unit: '丸', defaultDose: 8, defaultUnit: '丸' },
  { name: '补中益气丸', spec: '360丸/瓶', perBox: 360, unit: '丸', defaultDose: 8, defaultUnit: '丸' },
  { name: '归脾丸', spec: '360丸/瓶', perBox: 360, unit: '丸', defaultDose: 9, defaultUnit: '丸' },
  { name: '逍遥丸', spec: '360丸/瓶', perBox: 360, unit: '丸', defaultDose: 9, defaultUnit: '丸' },
  { name: '香砂养胃丸', spec: '360丸/瓶', perBox: 360, unit: '丸', defaultDose: 9, defaultUnit: '丸' },
  { name: '保和丸', spec: '360丸/瓶', perBox: 360, unit: '丸', defaultDose: 9, defaultUnit: '丸' },
  { name: '左归丸', spec: '360丸/瓶', perBox: 360, unit: '丸', defaultDose: 9, defaultUnit: '丸' },
  { name: '右归丸', spec: '360丸/瓶', perBox: 360, unit: '丸', defaultDose: 9, defaultUnit: '丸' },
  { name: '大补阴丸', spec: '360丸/瓶', perBox: 360, unit: '丸', defaultDose: 6, defaultUnit: '丸' },
  
  // 片剂
  { name: '阿司匹林肠溶片', spec: '100mg×30片/盒', perBox: 30, unit: '片', dosePerUnit: 100, defaultDose: 100, defaultUnit: 'mg' },
  { name: '布洛芬片', spec: '0.2g×20片/盒', perBox: 20, unit: '片', dosePerUnit: 200, defaultDose: 600, defaultUnit: 'mg' },
  { name: '阿莫西林胶囊', spec: '0.5g×24粒/盒', perBox: 24, unit: '粒', dosePerUnit: 500, defaultDose: 1500, defaultUnit: 'mg' },
  { name: '氯雷他定片', spec: '10mg×6片/盒', perBox: 6, unit: '片', dosePerUnit: 10, defaultDose: 10, defaultUnit: 'mg' },
  { name: '硝苯地平片', spec: '10mg×30片/瓶', perBox: 30, unit: '片', dosePerUnit: 10, defaultDose: 30, defaultUnit: 'mg' },
  { name: '二甲双胍片', spec: '0.25g×60片/瓶', perBox: 60, unit: '片', dosePerUnit: 250, defaultDose: 1500, defaultUnit: 'mg' },
  { name: '二甲双胍缓释片', spec: '0.5g×30片/盒', perBox: 30, unit: '片', dosePerUnit: 500, defaultDose: 1000, defaultUnit: 'mg' },
  { name: '格列美脲片', spec: '2mg×60片/盒', perBox: 60, unit: '片', dosePerUnit: 2, defaultDose: 4, defaultUnit: 'mg' },
  { name: '辛伐他汀片', spec: '20mg×7片/盒', perBox: 7, unit: '片', dosePerUnit: 20, defaultDose: 20, defaultUnit: 'mg' },
  { name: '氨氯地平片', spec: '5mg×7片/盒', perBox: 7, unit: '片', dosePerUnit: 5, defaultDose: 5, defaultUnit: 'mg' },
  { name: '苯磺酸氨氯地平片', spec: '5mg×28片/盒', perBox: 28, unit: '片', dosePerUnit: 5, defaultDose: 5, defaultUnit: 'mg' },
  { name: '苯磺酸左旋氨氯地平片', spec: '2.5mg×28片/盒', perBox: 28, unit: '片', dosePerUnit: 2.5, defaultDose: 2.5, defaultUnit: 'mg' },
  { name: '替米沙坦片', spec: '40mg×28片/盒', perBox: 28, unit: '片', dosePerUnit: 40, defaultDose: 80, defaultUnit: 'mg' },
  { name: '厄贝沙坦片', spec: '150mg×14片/盒', perBox: 14, unit: '片', dosePerUnit: 150, defaultDose: 150, defaultUnit: 'mg' },
  { name: '厄贝沙坦氢氯噻嗪片', spec: '150mg/12.5mg×14片/盒', perBox: 14, unit: '片', defaultDose: 1, defaultUnit: '片' },
  { name: '缬沙坦胶囊', spec: '80mg×7粒/盒', perBox: 7, unit: '粒', dosePerUnit: 80, defaultDose: 80, defaultUnit: 'mg' },
  { name: '缬沙坦氨氯地平片', spec: '80mg/5mg×7片/盒', perBox: 7, unit: '片', defaultDose: 1, defaultUnit: '片' },
  { name: '缬沙坦氢氯噻嗪片', spec: '80mg/12.5mg×14片/盒', perBox: 14, unit: '片', defaultDose: 1, defaultUnit: '片' },
  { name: '培哚普利片', spec: '4mg×10片/盒', perBox: 10, unit: '片', dosePerUnit: 4, defaultDose: 4, defaultUnit: 'mg' },
  { name: '富马酸比索洛尔片', spec: '5mg×10片/盒', perBox: 10, unit: '片', dosePerUnit: 5, defaultDose: 5, defaultUnit: 'mg' },
  { name: '美托洛尔片', spec: '25mg×20片/盒', perBox: 20, unit: '片', dosePerUnit: 25, defaultDose: 50, defaultUnit: 'mg' },
  { name: '琥珀酸美托洛尔缓释片', spec: '47.5mg×100片/瓶', perBox: 100, unit: '片', dosePerUnit: 47.5, defaultDose: 47.5, defaultUnit: 'mg' },
  { name: '阿托伐他汀钙片', spec: '20mg×7片/盒', perBox: 7, unit: '片', dosePerUnit: 20, defaultDose: 20, defaultUnit: 'mg' },
  { name: '瑞舒伐他汀钙片', spec: '10mg×7片/盒', perBox: 7, unit: '片', dosePerUnit: 10, defaultDose: 10, defaultUnit: 'mg' },
  { name: '匹伐他汀钙片', spec: '2mg×7片/盒', perBox: 7, unit: '片', dosePerUnit: 2, defaultDose: 2, defaultUnit: 'mg' },
  { name: '阿卡波糖片', spec: '50mg×30片/盒', perBox: 30, unit: '片', dosePerUnit: 50, defaultDose: 150, defaultUnit: 'mg' },
  { name: '伏格列波糖片', spec: '0.2mg×30片/盒', perBox: 30, unit: '片', dosePerUnit: 0.2, defaultDose: 0.6, defaultUnit: 'mg' },
  { name: '西格列汀片', spec: '100mg×30片/盒', perBox: 30, unit: '片', dosePerUnit: 100, defaultDose: 100, defaultUnit: 'mg' },
  { name: '沙格列汀片', spec: '5mg×14片/盒', perBox: 14, unit: '片', dosePerUnit: 5, defaultDose: 5, defaultUnit: 'mg' },
  { name: '利格列汀片', spec: '5mg×14片/盒', perBox: 14, unit: '片', dosePerUnit: 5, defaultDose: 5, defaultUnit: 'mg' },
  { name: '格列齐特缓释片', spec: '30mg×60片/盒', perBox: 60, unit: '片', dosePerUnit: 30, defaultDose: 60, defaultUnit: 'mg' },
  { name: '格列吡嗪片', spec: '5mg×30片/盒', perBox: 30, unit: '片', dosePerUnit: 5, defaultDose: 10, defaultUnit: 'mg' },
  { name: '金水宝片', spec: '0.75g×36片/盒', perBox: 36, unit: '片', defaultDose: 3, defaultUnit: '片' },
  { name: '心可舒片', spec: '0.3g×72片/盒', perBox: 72, unit: '片', defaultDose: 4, defaultUnit: '片' },
  { name: '复方血栓通片', spec: '0.5g×36片/盒', perBox: 36, unit: '片', defaultDose: 3, defaultUnit: '片' },
  { name: '银杏叶片', spec: '9.6mg×96片/盒', perBox: 96, unit: '片', dosePerUnit: 9.6, defaultDose: 2, defaultUnit: '片' },
  { name: '雷贝拉唑钠肠溶片', spec: '10mg×10片/盒', perBox: 10, unit: '片', dosePerUnit: 10, defaultDose: 10, defaultUnit: 'mg' },
  { name: '艾司奥美拉唑肠溶片', spec: '20mg×7片/盒', perBox: 7, unit: '片', dosePerUnit: 20, defaultDose: 20, defaultUnit: 'mg' },
  { name: '艾普拉唑肠溶片', spec: '5mg×10片/盒', perBox: 10, unit: '片', dosePerUnit: 5, defaultDose: 5, defaultUnit: 'mg' },
  { name: '阿仑膦酸钠片', spec: '70mg×6片/盒', perBox: 6, unit: '片', dosePerUnit: 70, defaultDose: 70, defaultUnit: 'mg' },
  { name: '阿奇霉素片', spec: '0.25g×6片/盒', perBox: 6, unit: '片', dosePerUnit: 250, defaultDose: 500, defaultUnit: 'mg' },
  { name: '阿昔洛韦片', spec: '0.1g×24片/盒', perBox: 24, unit: '片', dosePerUnit: 100, defaultDose: 800, defaultUnit: 'mg' },
  { name: '阿普唑仑片', spec: '0.4mg×24片/盒', perBox: 24, unit: '片', dosePerUnit: 0.4, defaultDose: 0.8, defaultUnit: 'mg' },
  { name: '艾司唑仑片', spec: '1mg×30片/盒', perBox: 30, unit: '片', dosePerUnit: 1, defaultDose: 2, defaultUnit: 'mg' },
  { name: '维生素B1片', spec: '10mg×100片/瓶', perBox: 100, unit: '片', dosePerUnit: 10, defaultDose: 30, defaultUnit: 'mg' },
  { name: '维生素B2片', spec: '5mg×100片/瓶', perBox: 100, unit: '片', dosePerUnit: 5, defaultDose: 15, defaultUnit: 'mg' },
  { name: '维生素C片', spec: '0.1g×100片/瓶', perBox: 100, unit: '片', dosePerUnit: 100, defaultDose: 300, defaultUnit: 'mg' },
  { name: '阿莫西林克拉维酸钾片', spec: '0.375g×12片/盒', perBox: 12, unit: '片', dosePerUnit: 375, defaultDose: 1125, defaultUnit: 'mg' },
  { name: '铝碳酸镁片', spec: '0.5g×48片/盒', perBox: 48, unit: '片', dosePerUnit: 500, defaultDose: 1500, defaultUnit: 'mg' },
  { name: '盐酸西替利嗪片', spec: '10mg×24片/盒', perBox: 24, unit: '片', dosePerUnit: 10, defaultDose: 10, defaultUnit: 'mg' },
  { name: '奥美拉唑肠溶片', spec: '20mg×14片/盒', perBox: 14, unit: '片', dosePerUnit: 20, defaultDose: 20, defaultUnit: 'mg' },
  { name: '兰索拉唑肠溶胶囊', spec: '30mg×14粒/盒', perBox: 14, unit: '粒', dosePerUnit: 30, defaultDose: 30, defaultUnit: 'mg' },
  { name: '泮托拉唑钠肠溶片', spec: '40mg×7片/盒', perBox: 7, unit: '片', dosePerUnit: 40, defaultDose: 40, defaultUnit: 'mg' },
  { name: '多潘立酮片', spec: '10mg×30片/盒', perBox: 30, unit: '片', dosePerUnit: 10, defaultDose: 30, defaultUnit: 'mg' },
  { name: '莫沙必利片', spec: '5mg×24片/盒', perBox: 24, unit: '片', dosePerUnit: 5, defaultDose: 15, defaultUnit: 'mg' },
  { name: '伊托必利片', spec: '50mg×12片/盒', perBox: 12, unit: '片', dosePerUnit: 50, defaultDose: 150, defaultUnit: 'mg' },
  { name: '恩格列净片', spec: '10mg×30片/盒', perBox: 30, unit: '片', dosePerUnit: 10, defaultDose: 10, defaultUnit: 'mg' },
  { name: '卡格列净片', spec: '100mg×30片/盒', perBox: 30, unit: '片', dosePerUnit: 100, defaultDose: 100, defaultUnit: 'mg' },
  { name: '达格列净片', spec: '10mg×30片/盒', perBox: 30, unit: '片', dosePerUnit: 10, defaultDose: 10, defaultUnit: 'mg' },
  { name: '维格列汀片', spec: '50mg×28片/盒', perBox: 28, unit: '片', dosePerUnit: 50, defaultDose: 100, defaultUnit: 'mg' },
  { name: '坎地氢噻片', spec: '16mg/12.5mg×14片/盒', perBox: 14, unit: '片', defaultDose: 1, defaultUnit: '片' },
  { name: '阿齐沙坦片', spec: '40mg×14片/盒', perBox: 14, unit: '片', dosePerUnit: 40, defaultDose: 80, defaultUnit: 'mg' },
  { name: '美阿沙坦钾片', spec: '40mg×7片/盒', perBox: 7, unit: '片', dosePerUnit: 40, defaultDose: 40, defaultUnit: 'mg' },
  { name: '奥美沙坦酯片', spec: '20mg×7片/盒', perBox: 7, unit: '片', dosePerUnit: 20, defaultDose: 20, defaultUnit: 'mg' },
  { name: '沙库巴曲缬沙坦片', spec: '100mg×14片/盒', perBox: 14, unit: '片', defaultDose: 200, defaultUnit: 'mg' },
  
  // 胶囊剂
  { name: '复方甲氧那明胶囊', spec: '12.5mg×40粒/盒', perBox: 40, unit: '粒', defaultDose: 2, defaultUnit: '粒' },
  { name: '桉柠蒎肠溶胶囊', spec: '0.3g×36粒/盒', perBox: 36, unit: '粒', defaultDose: 0.6, defaultUnit: 'g' },
  { name: '阿法骨化醇软胶囊', spec: '0.25μg×20粒/盒', perBox: 20, unit: '粒', defaultDose: 1, defaultUnit: 'μg' },
  { name: '阿昔莫司胶囊', spec: '0.25g×24粒/盒', perBox: 24, unit: '粒', dosePerUnit: 250, defaultDose: 500, defaultUnit: 'mg' },
  { name: '头孢克洛胶囊', spec: '0.25g×12粒/盒', perBox: 12, unit: '粒', dosePerUnit: 250, defaultDose: 750, defaultUnit: 'mg' },
  { name: '头孢克肟胶囊', spec: '0.1g×10粒/盒', perBox: 10, unit: '粒', dosePerUnit: 100, defaultDose: 200, defaultUnit: 'mg' },
  { name: '诺氟沙星胶囊', spec: '0.1g×24粒/盒', perBox: 24, unit: '粒', dosePerUnit: 100, defaultDose: 600, defaultUnit: 'mg' },
  { name: '双氯芬酸钠缓释胶囊', spec: '50mg×10粒/盒', perBox: 10, unit: '粒', dosePerUnit: 50, defaultDose: 100, defaultUnit: 'mg' },
  { name: '芪苈强心胶囊', spec: '0.3g×36粒/盒', perBox: 36, unit: '粒', defaultDose: 4, defaultUnit: '粒' },
  { name: '心可舒胶囊', spec: '0.3g×72粒/盒', perBox: 72, unit: '粒', defaultDose: 4, defaultUnit: '粒' },
  
  // 口服液
  { name: '羧甲司坦口服溶液', spec: '10ml:0.5g×10支/盒', perBox: 10, unit: '支', defaultDose: 30, defaultUnit: 'ml' },
  { name: '氨溴索口服溶液', spec: '100ml/瓶', perBox: 1, unit: '瓶', defaultDose: 30, defaultUnit: 'ml' },
  { name: '氯雷他定糖浆', spec: '60ml/瓶', perBox: 1, unit: '瓶', defaultDose: 10, defaultUnit: 'ml' },
  { name: '双黄连口服液', spec: '10ml×12支/盒', perBox: 12, unit: '支', defaultDose: 30, defaultUnit: 'ml' },
  { name: '生脉饮口服液', spec: '10ml×10支/盒', perBox: 10, unit: '支', defaultDose: 30, defaultUnit: 'ml' },
  { name: '安神补脑液', spec: '10ml×10支/盒', perBox: 10, unit: '支', defaultDose: 20, defaultUnit: 'ml' },
  { name: '爱维心口服液', spec: '10ml×4支/盒', perBox: 4, unit: '支', defaultDose: 10, defaultUnit: 'ml' },
  { name: '对乙酰氨基酚口服混悬液', spec: '100ml/瓶', perBox: 1, unit: '瓶', defaultDose: 15, defaultUnit: 'ml' },
  { name: '布洛芬混悬液', spec: '100ml/瓶', perBox: 1, unit: '瓶', defaultDose: 15, defaultUnit: 'ml' },
  { name: '乳果糖口服溶液', spec: '100ml/瓶', perBox: 1, unit: '瓶', defaultDose: 30, defaultUnit: 'ml' },
  
  // 颗粒剂
  { name: '感冒灵颗粒', spec: '10g×9袋/盒', perBox: 9, unit: '袋', defaultDose: 30, defaultUnit: 'g' },
  { name: '板蓝根颗粒', spec: '10g×20袋/盒', perBox: 20, unit: '袋', defaultDose: 30, defaultUnit: 'g' },
  { name: '连花清瘟颗粒', spec: '6g×10袋/盒', perBox: 10, unit: '袋', defaultDose: 18, defaultUnit: 'g' },
  { name: '阿莫西林颗粒', spec: '0.125g×24袋/盒', perBox: 24, unit: '袋', defaultDose: 1.5, defaultUnit: 'g' },
  { name: '阿奇霉素颗粒', spec: '0.1g×3袋/盒', perBox: 3, unit: '袋', defaultDose: 0.2, defaultUnit: 'g' },
  { name: '头孢克洛颗粒', spec: '0.125g×12袋/盒', perBox: 12, unit: '袋', defaultDose: 0.75, defaultUnit: 'g' },
  { name: '蒙脱石散', spec: '3g×10袋/盒', perBox: 10, unit: '袋', defaultDose: 9, defaultUnit: 'g' },
  { name: '聚乙二醇4000散', spec: '10g×10袋/盒', perBox: 10, unit: '袋', defaultDose: 20, defaultUnit: 'g' },
  
  // 注射剂
  { name: '甘精胰岛素注射液', spec: '3ml:300IU/支', perBox: 1, unit: '支', defaultDose: 20, defaultUnit: 'IU' },
  { name: '精蛋白人胰岛素注射液', spec: '3ml:300IU/支', perBox: 1, unit: '支', defaultDose: 24, defaultUnit: 'IU' },
  { name: '地塞米松磷酸钠注射液', spec: '1ml:5mg/支', perBox: 1, unit: '支', defaultDose: 5, defaultUnit: 'mg' },
  { name: '呋塞米注射液', spec: '2ml:20mg/支', perBox: 1, unit: '支', defaultDose: 20, defaultUnit: 'mg' },
  { name: '多巴胺注射液', spec: '2ml:20mg/支', perBox: 1, unit: '支', defaultDose: 200, defaultUnit: 'mg' },
  { name: '阿托品注射液', spec: '1ml:0.5mg/支', perBox: 1, unit: '支', defaultDose: 1, defaultUnit: 'mg' },
  { name: '倍他司汀注射液', spec: '2ml:10mg/支', perBox: 1, unit: '支', defaultDose: 10, defaultUnit: 'mg' },
  { name: '长春西汀注射液', spec: '2ml:10mg×6支/盒', perBox: 6, unit: '支', defaultDose: 20, defaultUnit: 'mg' },
  { name: '玻璃酸钠滴眼液', spec: '5ml:5mg/支', perBox: 1, unit: '支', defaultDose: 1, defaultUnit: '支' },
  { name: '妥布霉素地塞米松滴眼液', spec: '5ml/支', perBox: 1, unit: '支', defaultDose: 1, defaultUnit: '支' },
  { name: '左氧氟沙星滴眼液', spec: '5ml:15mg/支', perBox: 1, unit: '支', defaultDose: 6, defaultUnit: '滴' },
  { name: '布林佐胺滴眼液', spec: '5ml/支', perBox: 1, unit: '支', defaultDose: 2, defaultUnit: '滴' },
  
  // 输液
  { name: '氯化钠注射液', spec: '250ml:2.25g/瓶', perBox: 1, unit: '瓶', defaultDose: 250, defaultUnit: 'ml' },
  { name: '葡萄糖注射液', spec: '250ml:12.5g/瓶', perBox: 1, unit: '瓶', defaultDose: 250, defaultUnit: 'ml' },
  { name: '葡萄糖氯化钠注射液', spec: '250ml/瓶', perBox: 1, unit: '瓶', defaultDose: 250, defaultUnit: 'ml' },
  { name: '葡萄糖酸钙注射液', spec: '10ml:1g/支', perBox: 1, unit: '支', defaultDose: 10, defaultUnit: 'ml' },
  
  // 外用
  { name: '开塞露', spec: '20ml×2支/盒', perBox: 2, unit: '支', defaultDose: 1, defaultUnit: '支' },
  { name: '碘伏消毒液', spec: '500ml/瓶', perBox: 1, unit: '瓶', defaultDose: 1, defaultUnit: '次' },
  { name: '医用酒精', spec: '500ml/瓶', perBox: 1, unit: '瓶', defaultDose: 1, defaultUnit: '次' },
];

// GET: 获取所有药品
export async function GET() {
  return NextResponse.json({
    success: true,
    count: DRUGS_DB.length,
    drugs: DRUGS_DB
  });
}

// POST: 更新药品信息
export async function POST(request: Request) {
  try {
    const { name, updates } = await request.json();
    
    // 更新数据库中的药品信息
    const index = DRUGS_DB.findIndex(d => d.name === name);
    if (index >= 0) {
      DRUGS_DB[index] = { ...DRUGS_DB[index], ...updates };
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}
