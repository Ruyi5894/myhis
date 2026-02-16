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

// 生成固定结果的提示词（重点识别错误）
function generateStrictPrompt(patientData: any, categoriesText: string): string {
  return `你是一位资深医学专家，负责审核门诊病历，找出其中的错误、遗漏和不合理之处。

病历信息：
- 患者：${patientData.name || '未知'}，${patientData.gender || '未知'}，${patientData.age || '未知'}岁
- 科室：${patientData.dept || '未知'}
- 主诉：${patientData.chiefComplaint || '未记录'}
- 现病史：${patientData.presentIllness || '未记录'}
- 既往史：${patientData.pastHistory || '未记录'}
- 体格检查：${patientData.physicalExam || '未记录'}
- 初步诊断：${patientData.diagnosis || '未记录'}
- 处理措施：${patientData.treatment || '未记录'}

请按以下规则检查病历：

【关键错误】（扣20-30分，必须修改）：
1. 诊断与主诉/现病史症状不符
2. 处理措施与诊断无关
3. 用药剂量明显错误

【常见问题】（扣5-15分，建议修改）：
1. 主诉缺少时间（如只写"咽痛"，应写"咽痛3天"）
2. 主诉缺少主要症状（只有时间没有症状）
3. 现病史过于简单（少于15字）
4. 既往史空白
5. 体格检查缺失或与主诉无关
6. 处理措施空白
7. 年龄格式错误（如"78岁岁"）
8. 科室未填写

请输出简洁的JSON结果：
{
  "totalScore": 评分（满分100，减去扣分）,
  "errorCount": 错误总数,
  "criticalErrors": [{"type": "关键错误/常见问题", "content": "具体问题描述（不要笼统，要指出具体哪里有问题）", "location": "字段名"}],
  "suggestions": ["具体改进建议1（指出应该怎么改）", "具体改进建议2"],
  "strengths": ["病历中做得好的地方"],
  "summary": "一句话总结问题（不超过20字）",
  "isQualified": true/false
}

要求：
1. errorCount = criticalErrors.length + suggestions.length - strengths.length（只统计问题和错误，不统计亮点）
2. criticalErrors 最多3个，只写最重要的
3. suggestions 最多3条，每条要具体可行
4. strengths 最多2条
5. 不要返回 scores 字段
6. 只输出JSON，不要有其他文字`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      patientData,  // 患者病历数据
      weights,       // 自定义权重（可选）
      zlh,          // 病历号（用于保存历史）
      forceRefresh = false,  // 是否强制重新评价
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
    
    // 如果已有评分且不是强制刷新，直接返回缓存结果
    if (history[storageKey] && !forceRefresh) {
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
