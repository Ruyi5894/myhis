// 版本管理配置
export const VERSION = {
  current: '1.0.6',
  name: '基础框架版',
  buildDate: '2026-02-14',
  author: 'Ruyi',
  description: '病史分析考核系统初始版本',
  features: [
    '数据看板 - 住院/门诊患者统计',
    '患者查询 - 按姓名/卡号/住院号搜索',
    '考核评分模块（建设中）',
    '报表导出模块（建设中）',
  ],
  database: {
    server: '192.168.1.243',
    name: 'myhis',
  },
  // 更新日志
  changelog: [
    { version: '1.0.0', date: '2026-02-14', content: '初始版本发布' },
    { version: '1.0.2', date: '2026-02-14', content: '患者查询页面完善：添加时间范围筛选（默认本月1号至今）、快捷日期按钮、住院/门诊类型筛选' },
    { version: '1.0.3', date: '2026-02-14', content: '修复SQL分页问题，调整默认日期范围为2017年至今' },
    { version: '1.0.4', date: '2026-02-14', content: '患者详情页面：点击患者可查看基本信息、诊断信息、费用明细、出院信息' },
    { version: '1.0.5', date: '2026-02-14', content: '修复门诊记录空值问题，尝试关联患者基本信息（但数据库中门诊与患者主档关联已丢失）' },
  ],
};

export const APP_INFO = {
  name: '病史分析考核系统',
  subtitle: '医院病史智能分析与考核平台',
  copyright: '© 2026',
};
