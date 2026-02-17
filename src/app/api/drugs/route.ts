import { NextResponse } from 'next/server';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://192.168.1.243:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3-vl:8b';

// 从数据库获取所有处方的药品规格（按药品名称去重）
export async function GET() {
  try {
    // 直接返回本地药品数据库中的药品列表，让前端显示并让用户触发AI分析
    const drugs = [
      // 丸剂
      { name: '麝香保心丸', spec: '22.5mg×42丸/瓶' },
      { name: '复方丹参滴丸', spec: '27mg×180丸/瓶' },
      { name: '银杏叶滴丸', spec: '9.6mg×80丸/盒' },
      { name: '六味地黄丸', spec: '每8丸重1.44g' },
      { name: '安脑丸', spec: '3g(3g/11粒)×6丸/盒' },
      
      // 片剂
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
      { name: '西格列汀二甲双胍片', spec: '50mg:850mg×28片/盒' },
      { name: '富马酸比索洛尔片', spec: '5mg×10片/盒' },
      { name: '美托洛尔片', spec: '25mg×20片/盒' },
      { name: '琥珀酸美托洛尔缓释片', spec: '95mg×100片/瓶' },
      
      // 胶囊
      { name: '复方甲氧那明胶囊', spec: '12.5mg×40粒/盒' },
      { name: '头孢克洛缓释胶囊', spec: '187.5mg×12粒/盒' },
      { name: '桉柠蒎肠溶胶囊', spec: '0.3g×36粒/盒' },
      { name: '阿法骨化醇软胶囊', spec: '0.25ug×20粒/盒' },
      
      // 口服液
      { name: '羧甲司坦口服溶液', spec: '10ml:0.5g×10支/盒' },
      { name: '双黄连口服液', spec: '10ml×12支/盒' },
      { name: '安神补脑液', spec: '10ml×10支/盒' },
      
      // 颗粒
      { name: '感冒灵颗粒', spec: '10g×9袋/盒' },
      { name: '板蓝根颗粒', spec: '10g×20袋/盒' },
      
      // 注射剂
      { name: '甘精胰岛素注射液', spec: '3ml:300单位/支' },
      { name: '地塞米松磷酸钠注射液', spec: '1ml/支' },
      { name: '呋塞米注射液', spec: '2ml:20mg/支' },
    ];

    return NextResponse.json({
      success: true,
      count: drugs.length,
      drugs
    });

  } catch (error) {
    console.error('获取药品列表失败:', error);
    return NextResponse.json({ success: false, error: String(error) });
  }
}

// 分析单个药品规格
export async function POST(request: Request) {
  try {
    const { name, spec, quantity, dailyDose, usage } = await request.json();

    const prompt = `你是一个药品用量计算专家。请分析以下药品规格并计算可用天数。

药品信息：
- 药品名称：${name}
- 规格：${spec}
- 处方数量：${quantity || '未提供'}
- 用法：${usage || '未提供'}
- 每日用量：${dailyDose || '未提供'}

请分析规格中的剂量单位（如：丸、片、粒、支、袋、ml等），计算：
1. 规格中每盒/瓶含有多少单位
2. 根据处方数量计算总单位数
3. 根据用法和每日用量计算可用天数

请以JSON格式返回结果：
{
  "perBox": 每盒单位数,
  "unit": "单位类型",
  "totalUnits": 总单位数,
  "days": 可用天数,
  "calculation": "简要计算说明"
}

只返回JSON，不要其他文字。`;

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'AI调用失败' });
    }

    const result = await response.json();
    const aiResponse = result.response;

    // 尝试解析JSON
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ success: true, data: parsed });
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      data: { rawResponse: aiResponse }
    });

  } catch (error) {
    console.error('AI分析失败:', error);
    return NextResponse.json({ success: false, error: String(error) });
  }
}
