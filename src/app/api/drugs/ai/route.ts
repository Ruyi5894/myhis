import { NextResponse } from 'next/server';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://192.168.1.243:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'deepseek-r1:7b';

// GET: 获取所有需要分析的药品（从数据库）
export async function GET() {
  // 返回预设的药品列表供AI分析
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
    { name: '二甲双胍缓释片', spec: '0.5g×30片/瓶' },
    { name: '格列美脲片', spec: '2mg×60片/盒' },
    { name: '阿托伐他汀钙片', spec: '20mg×7片/盒' },
    { name: '瑞舒伐他汀钙片', spec: '10mg×7片/盒' },
    { name: '阿卡波糖片', spec: '50mg×30片/盒' },
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
  
  return NextResponse.json({
    success: true,
    count: drugs.length,
    drugs
  });
}

// POST: AI分析单个药品
export async function POST(request: Request) {
  try {
    const { name, spec } = await request.json();
    
    if (!name || !spec) {
      return NextResponse.json({ success: false, error: '缺少参数' });
    }

    const prompt = `从药品规格提取信息。
规格: ${spec}
返回JSON(只返回JSON): {"perBox":数字,"unit":"单位"}

例如: "22.5mg×42丸/瓶" 返回 {"perBox":42,"unit":"丸"}`;

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
    const responseText = result.response || '';
    
    // 尝试解析JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // 确保perBox是数字
      if (parsed.perBox) {
        parsed.perBox = parseInt(String(parsed.perBox).replace(/\D/g, ''));
      }
      return NextResponse.json({ success: true, data: parsed, raw: responseText });
    }

    // 尝试提取数字
    const numMatch = responseText.match(/(\d+)\s*(丸|片|粒|支|袋|颗)/);
    if (numMatch) {
      return NextResponse.json({
        success: true,
        data: { perBox: parseInt(numMatch[1]), unit: numMatch[2] }
      });
    }

    return NextResponse.json({ success: false, error: '无法解析', raw: responseText });

  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}
