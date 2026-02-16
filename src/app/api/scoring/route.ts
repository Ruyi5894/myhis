import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import SCORING_CONFIG, { SCORING_PROMPT } from '@/config/scoring';

// 评分历史文件路径
const SCORING_HISTORY_FILE = path.join(process.cwd(), 'data', 'scoring_history.json');

// 确保数据目录存在
const dataDir = path.dirname(SCORING_HISTORY_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 读取评分历史
function readScoringHistory(): Record<string, any> {
  try {
    if (fs.existsSync(SCORING_HISTORY_FILE)) {
      const data = fs.readFileSync(SCORING_HISTORY_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('读取评分历史失败:', error);
  }
  return {};
}

// 保存评分历史
function saveScoringHistory(history: Record<string, any>) {
  try {
    fs.writeFileSync(SCORING_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存评分历史失败:', error);
  }
}

// 生成病史唯一标识（用于缓存）
function generateCacheKey(patientData: any, weights?: any[]): string {
  const keyData = {
    name: patientData.name,
    visitDate: patientData.visitDate,
    dept: patientData.dept,
    chiefComplaint: patientData.chiefComplaint?.slice(0, 50),
    presentIllness: patientData.presentIllness?.slice(0, 100),
    diagnosis: patientData.diagnosis,
    weights: weights?.map((w: any) => `${w.name}:${w.weight}`).join(','),
  };
  return Buffer.from(JSON.stringify(keyData)).toString('base64');
}

// 生成更具体的提示词
function generateStrictPrompt(patientData: any, categoriesText: string): string {
  return `你是门诊病历质量审核专家。请严格按照以下病历内容进行评分，不要套用模板。

【病历原文内容】
主诉：${patientData.chiefComplaint || '未记录'}
现病史：${patientData.presentIllness || '未记录'}
既往史：${patientData.pastHistory || '未记录'}
体格检查：${patientData.physicalExam || '未记录'}
诊断：${patientData.diagnosis || '未记录'}
处理措施：${patientData.treatment || '未记录'}

【审核要求】
1. 逐字检查上述内容，找出具体问题
2. 问题必须引用原文原字，例如："主诉中'XXX'缺少时间描述"
3. 不要使用"内容过于简单"、"信息不完整"等笼统表述

【输出格式】（必须是有效JSON）
{
  "totalScore": 85,
  "errorCount": 2,
  "criticalErrors": [
    {"type": "关键错误", "content": "具体问题引用原文", "location": "字段名"}
  ],
  "suggestions": ["具体改进建议"],
  "strengths": ["具体亮点"],
  "summary": "20字以内的具体评价",
  "isQualified": false
}

只输出JSON，不要其他文字。`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      patientData,  // 患者病历数据
      weights,       // 自定义权重（可选）
      zlh,          // 病历号（用于保存历史）
      force = false,  // 强制重新评分
      model = SCORING_CONFIG.model  // 使用配置的模型
    } = body;

    if (!patientData) {
      return NextResponse.json(
        { success: false, error: '缺少病历数据' },
        { status: 400 }
      );
    }

    // 构建评分提示词
    const categoriesText = (weights 
      ? weights 
      : SCORING_CONFIG.categories.map((c: any) => `${c.name}（${c.weight}分）：${c.description}`)
    ).join('\n');

    // 生成缓存key
    const cacheKey = generateCacheKey(patientData, weights);
    
    // 检查是否有缓存的历史评分
    const history = readScoringHistory();
    
    // 如果有 zlh，使用zlh+cacheKey作为复合key
    const storageKey = zlh ? `${zlh}_${cacheKey.slice(0, 20)}` : cacheKey;
    
    // 如果已有评分且不是强制重新评分，直接返回缓存结果
    if (history[storageKey] && !force) {
      return NextResponse.json({
        success: true,
        data: {
          ...history[storageKey],
          cached: true,  // 标记为缓存结果
        }
      });
    }

    // 生成更严格的提示词
    const prompt = generateStrictPrompt(patientData, categoriesText);

    // 调用 Ollama API（使用更低温度确保一致性）
    const response = await fetch(`${SCORING_CONFIG.ollamaHost}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,  // 极低温度，确保评分一致性
          top_k: 5,
          top_p: 0.8,
          seed: 42,  // 使用固定种子
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API 错误: ${response.statusText}`);
    }

    const result = await response.json();
    
    // 解析 JSON 响应
    let scoringResult;
    try {
      // 尝试直接解析
      scoringResult = JSON.parse(result.response);
    } catch {
      // 如果直接解析失败，尝试提取 JSON
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          scoringResult = JSON.parse(jsonMatch[0]);
        } catch {
          scoringResult = {
            totalScore: 0,
            scores: [],
            strengths: [],
            improvements: [],
            summary: result.response.slice(0, 200),
            rawResponse: result.response
          };
        }
      } else {
        scoringResult = {
          totalScore: 0,
          scores: [],
          strengths: [],
          improvements: [],
          summary: result.response.slice(0, 200),
          rawResponse: result.response
        };
      }
    }

    // 确保 totalScore 是数字
    if (typeof scoringResult.totalScore !== 'number') {
      scoringResult.totalScore = 0;
    }

    // 保存评分结果到历史记录
    if (storageKey) {
      history[storageKey] = {
        ...scoringResult,
        model: model,
        scoredAt: new Date().toISOString(),
        usedWeights: weights || SCORING_CONFIG.categories.map((c: any) => ({ name: c.name, weight: c.weight })),
      };
      saveScoringHistory(history);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...scoringResult,
        model: model,
        usedWeights: weights || SCORING_CONFIG.categories.map((c: any) => ({ name: c.name, weight: c.weight })),
      }
    });

  } catch (error) {
    console.error('评分失败:', error);
    return NextResponse.json(
      { success: false, error: '评分失败: ' + String(error) },
      { status: 500 }
    );
  }
}
