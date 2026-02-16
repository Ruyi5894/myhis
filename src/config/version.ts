// 版本管理配置
export const VERSION = {
  current: '1.6.0',
  name: '卫健委规范版',
  buildDate: '2026-02-16',
  author: 'Ruyi',
  description: '门诊病史分析考核系统 - 按卫健委规范组织病史信息',
  features: [
    '门诊病历查询（去重、简易门诊过滤）',
    '按卫健委规范组织病史信息（5大模块）',
    '诊断名称关联（ICD代码 → 诊断名称）',
    '药品规格关联（完整名称+规格）',
    '费用明细与处方信息展示',
  ],
  database: {
    server: '192.168.1.243',
    name: 'myhis',
  },
  // 更新日志
  changelog: [
    { version: '1.0.0', date: '2026-02-14', content: '初始版本发布' },
    { version: '1.0.2', date: '2026-02-14', content: '患者查询页面完善：添加时间范围筛选、快捷日期按钮、住院/门诊类型筛选' },
    { version: '1.0.3', date: '2026-02-14', content: '修复SQL分页问题，调整默认日期范围为2017年至今' },
    { version: '1.0.4', date: '2026-02-14', content: '患者详情页面：点击患者可查看基本信息、诊断信息、费用明细、出院信息' },
    { version: '1.0.5', date: '2026-02-14', content: '修复门诊记录空值问题，尝试关联患者基本信息' },
    { version: '1.6.0', date: '2026-02-16', content: '纯门诊系统，按卫健委规范重新组织病史结构，添加诊断名称和药品规格关联，添加简易门诊过滤' },
  ],
};

export const APP_INFO = {
  name: '病史分析考核系统',
  subtitle: '医院病史智能分析与考核平台',
  copyright: '© 2026',
};
