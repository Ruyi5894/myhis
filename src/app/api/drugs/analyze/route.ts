import { NextResponse } from 'next/server';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://192.168.1.243:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3-vl:8b';

// 完整药品列表（从HIS系统常见药品）
const ALL_DRUGS = [
  { name: '麝香保心丸', spec: '22.5mg×42丸/瓶' },
  { name: '复方丹参滴丸', spec: '27mg×180丸/瓶' },
  { name: '银杏叶滴丸', spec: '9.6mg×80丸/盒' },
  { name: '六味地黄丸', spec: '每8丸重1.44g' },
  { name: '安脑丸', spec: '3g(3g/11粒)×6丸/盒' },
  { name: '芪苈强心胶囊', spec: '每粒装0.3g,36粒/盒' },
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
  { name: '匹伐他汀钙片', spec: '2mg×7片/盒' },
  { name: '阿卡波糖片', spec: '50mg×30片/盒' },
  { name: '伏格列波糖片', spec: '0.3mg×20片/盒' },
  { name: '西格列汀片', spec: '100mg×30片/盒' },
  { name: '利格列汀片', spec: '5mg×14片/盒' },
  { name: '富马酸比索洛尔片', spec: '5mg×10片/盒' },
  { name: '美托洛尔片', spec: '25mg×20片/盒' },
  { name: '琥珀酸美托洛尔缓释片', spec: '47.5mg×100片/瓶' },
  { name: '培哚普利叔丁胺片', spec: '4mg×10片/盒' },
  { name: '复方甲氧那明胶囊', spec: '12.5mg×40粒/盒' },
  { name: '头孢克洛缓释胶囊', spec: '187.5mg×12粒/盒' },
  { name: '头孢克肟胶囊', spec: '0.1g×10粒/盒' },
  { name: '桉柠蒎肠溶胶囊', spec: '0.3g×36粒/盒' },
  { name: '阿法骨化醇软胶囊', spec: '0.25ug×20粒/盒' },
  { name: '阿昔莫司胶囊', spec: '0.25g×24粒/盒' },
  { name: '羧甲司坦口服溶液', spec: '10ml:0.5g×10支/盒' },
  { name: '氨溴索口服液', spec: '100ml:0.3g/瓶' },
  { name: '双黄连口服液', spec: '10ml×12支/盒' },
  { name: '安神补脑液', spec: '10ml×10支/盒' },
  { name: '爱维心口服液', spec: '10ml×4支/盒' },
  { name: '感冒灵颗粒', spec: '10g×9袋/盒' },
  { name: '板蓝根颗粒', spec: '10g×20袋/盒' },
  { name: '连花清瘟颗粒', spec: '6g×10袋/盒' },
  { name: '蒙脱石散', spec: '3g×10袋/盒' },
  { name: '阿莫西林颗粒', spec: '125mg×24袋/盒' },
  { name: '阿奇霉素颗粒', spec: '0.5g×3袋/盒' },
  { name: '甘精胰岛素注射液', spec: '3ml:300单位/支' },
  { name: '地塞米松磷酸钠注射液', spec: '1ml/支' },
  { name: '呋塞米注射液', spec: '2ml:20mg/支' },
  { name: '维生素B1片', spec: '10mg×100片/瓶' },
  { name: '维生素B2片', spec: '5mg×100片/瓶' },
  { name: '维生素C片', spec: '0.1g×100片/瓶' },
  { name: '开塞露', spec: '20ml/支' },
  { name: '玻璃酸钠滴眼液', spec: '5ml:15mg/支' },
  { name: '左氧氟沙星滴眼液', spec: '5ml:24.4mg/支' },
  { name: '妥布霉素地塞米松滴眼液', spec: '15mg:5mg/5ml/支' },
  { name: '氯化钠注射液', spec: '500ml/瓶' },
  { name: '葡萄糖注射液', spec: '500ml/瓶' },
  { name: '葡萄糖氯化钠注射液', spec: '500ml/瓶' },
  { name: '心可舒片', spec: '0.31g×96片/盒' },
  { name: '心可舒胶囊', spec: '0.3g×72粒/盒' },
  { name: '复方血栓通片', spec: '0.4g×36片/盒' },
  { name: '金水宝片', spec: '0.42g×36片/瓶' },
  { name: '银杏叶片', spec: '19.2mg:4.8mg×96片/盒' },
  { name: '雷贝拉唑钠肠溶片', spec: '20mg×10片/盒' },
  { name: '艾司奥美拉唑镁肠溶片', spec: '20mg×7片/盒' },
  { name: '艾普拉唑肠溶片', spec: '5mg×10片/瓶' },
  { name: '阿仑膦酸钠片', spec: '70mg×1片/盒' },
  { name: '阿奇霉素片', spec: '0.25g×6片/盒' },
  { name: '阿莫西林胶囊', spec: '0.25g×24粒/盒' },
  { name: '阿莫西林克拉维酸钾片', spec: '457mg×12片/盒' },
  { name: '阿昔洛韦片', spec: '0.2g×24片/盒' },
  { name: '阿普唑仑片', spec: '0.4mg×24片/盒' },
  { name: '艾司唑仑片', spec: '1mg×30片/盒' },
  { name: '氯雷他定片', spec: '10mg×6片/盒' },
  { name: '盐酸西替利嗪片', spec: '10mg×24片/盒' },
  { name: '布洛芬片', spec: '0.1g×20片/盒' },
  { name: '布洛芬缓释胶囊', spec: '0.3g×20粒/盒' },
  { name: '双氯芬酸钠双释放肠溶胶囊', spec: '75mg×10粒/盒' },
  { name: '铝碳酸镁片', spec: '0.5g×48片/盒' },
  { name: '奥美拉唑肠溶片', spec: '20mg×14片/盒' },
  { name: '兰索拉唑胶囊', spec: '30mg×14粒/盒' },
  { name: '泮托拉唑钠肠溶片', spec: '40mg×7片/盒' },
  { name: '多潘立酮片', spec: '10mg×30片/盒' },
  { name: '枸橼酸莫沙必利片', spec: '5mg×24片/盒' },
  { name: '盐酸依托必利片', spec: '50mg×12片/盒' },
  { name: '乳果糖口服溶液', spec: '100ml:66.7g/瓶' },
  { name: '聚乙二醇4000散', spec: '10g×10袋/盒' },
  { name: '枯草杆菌二联活菌肠溶胶囊', spec: '0.25g×36粒/盒' },
  { name: '双歧杆菌乳杆菌三联活菌片', spec: '0.5g×60片/盒' },
  { name: '复方米曲霉胰酶片', spec: '12片/盒' },
  { name: '胰酶肠溶胶囊', spec: '0.15g×30粒/盒' },
  { name: '磷酸西格列汀片', spec: '100mg×30片/盒' },
  { name: '沙格列汀片', spec: '5mg×14片/盒' },
  { name: '维格列汀片', spec: '50mg×28片/盒' },
  { name: '恩格列净片', spec: '10mg×30片/盒' },
  { name: '卡格列净片', spec: '100mg×30片/盒' },
  { name: '达格列净片', spec: '10mg×30片/盒' },
  { name: '利格列汀二甲双胍片', spec: '2.5mg:850mg×14片/盒' },
  { name: '西格列汀二甲双胍片', spec: '50mg:850mg×28片/盒' },
  { name: '坎地氢噻片', spec: '12mg:6.25mg×14片/盒' },
  { name: '阿齐沙坦片', spec: '50mg×14片/盒' },
  { name: '美阿沙坦钾片', spec: '40mg×7片/盒' },
  { name: '奥美沙坦酯片', spec: '20mg×7片/盒' },
  { name: '替米沙坦氢氯噻嗪片', spec: '80mg:12.5mg×7片/盒' },
  { name: '氯沙坦钾氢氯噻嗪片', spec: '50mg:12.5mg×14片/盒' },
  { name: '缬沙坦氢氯噻嗪片', spec: '80mg:12.5mg×14片/盒' },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    count: ALL_DRUGS.length,
    drugs: ALL_DRUGS
  });
}

export async function POST(request: Request) {
  try {
    const { name, spec } = await request.json();
    
    if (!name || !spec) {
      return NextResponse.json({ success: false, error: '缺少参数' });
    }

    const prompt = `分析药品规格，返回JSON格式：{"perBox":数字,"unit":"单位"}
药品名称：${name}
规格：${spec}`;

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
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ success: true, data: parsed });
    }

    return NextResponse.json({ success: false, error: '无法解析' });

  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}
