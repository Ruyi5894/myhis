import { NextResponse } from 'next/server';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://192.168.1.243:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3-vl:8b';

// 常用药品列表
const COMMON_DRUGS = [
  { name: '麝香保心丸', spec: '22.5mg×42丸/瓶' },
  { name: '复方丹参滴丸', spec: '27mg×180丸/瓶' },
  { name: '银杏叶滴丸', spec: '9.6mg×80丸/盒' },
  { name: '六味地黄丸', spec: '每8丸重1.44g' },
  { name: '阿司匹林肠溶片', spec: '100mg×30片/盒' },
  { name: '苯磺酸氨氯地平片', spec: '5mg×28片/盒' },
  { name: '替米沙坦片', spec: '40mg×28片/盒' },
  { name: '厄贝沙坦氢氯噻嗪片', spec: '150mg/12.5mg×14片/瓶' },
  { name: '二甲双胍缓释片', spec: '0.5g×30片/瓶' },
  { name: '阿托伐他汀钙片', spec: '20mg×7片/盒' },
  { name: '瑞舒伐他汀钙片', spec: '10mg×7片/盒' },
  { name: '阿卡波糖片', spec: '50mg×30片/盒' },
  { name: '美托洛尔片', spec: '25mg×20片/盒' },
  { name: '羧甲司坦口服溶液', spec: '10ml:0.5g×10支/盒' },
  { name: '双黄连口服液', spec: '10ml×12支/盒' },
  { name: '感冒灵颗粒', spec: '10g×9袋/盒' },
];

// GET: 获取药品列表
export async function GET() {
  return NextResponse.json({
    success: true,
    count: COMMON_DRUGS.length,
    drugs: COMMON_DRUGS
  });
}

// POST: AI分析
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, spec } = body || {};

    if (!name || !spec) {
      return NextResponse.json({ success: false, error: '缺少参数' });
    }

    const prompt = `分析规格"${spec}"，返回JSON: {"perBox":数字,"unit":"单位"}`;

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
