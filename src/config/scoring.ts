// 病史评分配置
export const SCORING_CONFIG = {
  // Ollama 服务器地址
  ollamaHost: 'http://192.168.1.243:11434',
  // 使用的模型
  model: 'qwen3-vl:8b',
  // 评分项及默认权重（总和应为100）
  categories: [
    { id: 'chiefComplaint', name: '主诉完整性', weight: 10, description: '主诉是否清晰、完整，体现主要症状和时间' },
    { id: 'presentIllness', name: '现病史详细度', weight: 20, description: '现病史描述是否详细、规范，有鉴别诊断思路' },
    { id: 'pastHistory', name: '既往史完整性', weight: 10, description: '既往史、个人史、家族史是否记录完整' },
    { id: 'physicalExam', name: '体格检查规范性', weight: 15, description: '体格检查是否规范、针对主诉' },
    { id: 'diagnosis', name: '诊断准确性', weight: 20, description: '诊断是否准确、完整，有无鉴别诊断' },
    { id: 'treatment', name: '处理措施合理性', weight: 15, description: '检查、用药、处理措施是否合理' },
    { id: 'writing', name: '病历书写规范', weight: 10, description: '用词、格式、时间是否规范' },
  ],
};

// 评分提示词模板
export const SCORING_PROMPT = `你是一位资深医学专家，请对以下门诊病历进行评分分析。

病历信息：
- 患者：{name}，{gender}，{age}岁
- 就诊日期：{visitDate}
- 科室：{dept}
- 主诉：{chiefComplaint}
- 现病史：{presentIllness}
- 既往史：{pastHistory}
- 体格检查：{physicalExam}
- 初步诊断：{diagnosis}
- 处理措施：{treatment}

请按以下标准评分（满分100分）：
{categories}

输出格式要求（JSON）：
{
  "totalScore": 总分,
  "scores": [
    {"category": "评分项名称", "score": 得分, "maxScore": 满分, "comment": "扣分理由"}
  ],
  "strengths": ["病历亮点1", "病历亮点2"],
  "improvements": ["改进建议1", "改进建议2"],
  "summary": "整体评价（50字以内）"
}

注意：
1. 严格按照评分标准打分，不要随意给满分
2. 扣分要有明确理由
3. 亮点和改进建议要具体
4. 只输出JSON，不要有其他文字`;

export default SCORING_CONFIG;
