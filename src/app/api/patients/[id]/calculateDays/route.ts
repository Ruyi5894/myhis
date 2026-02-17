import { NextResponse } from 'next/server';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://192.168.1.243:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3-vl:8b';

// 使用本地大模型计算可用天数
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      medicationName,  // 药品名称
      spec,          // 规格
      quantity,      // 数量
      usage,         // 用法 (如 TID, BID, QD)
      dailyDose,     // 每日用量 (数值)
      doseUnit       // 每日用量单位
    } = body;

    if (!medicationName || !spec || !quantity) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      });
    }

    // 构建提示词让大模型计算
    const prompt = `你是一个药品用量计算专家。请根据以下信息计算药品的可用天数。

药品信息：
- 药品名称：${medicationName}
- 规格：${spec}
- 数量：${quantity}
- 用法：${usage || '未说明'}
- 每日用量：${dailyDose}${doseUnit || ''}

请分析规格中的单位（如：片、丸、粒、支、袋、ml、g等），计算：
1. 规格中每盒/瓶/支含有多少单位
2. 总共多少单位
3. 根据用法计算每日用量
4. 可用天数

请以JSON格式返回结果：
{
  "totalUnits": 总单位数,
  "dailyUnits": 每日用量单位,
  "days": 可用天数,
  "calculation": "计算过程说明",
  "notes": "任何需要注意的问题"
}

只返回JSON，不要其他文字。`;

    // 调用本地Ollama
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: '大模型调用失败'
      });
    }

    const result = await response.json();
    const aiResponse = result.response;

    // 尝试解析JSON
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          success: true,
          data: parsed
        });
      }
    } catch (e) {
      // 解析失败，返回原始响应
    }

    return NextResponse.json({
      success: true,
      data: {
        rawResponse: aiResponse,
        note: '无法解析为JSON，请人工确认'
      }
    });

  } catch (error) {
    console.error('计算可用天数失败:', error);
    return NextResponse.json({
      success: false,
      error: '计算失败: ' + String(error)
    });
  }
}
