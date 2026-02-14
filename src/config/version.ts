// 版本管理配置
export const VERSION = {
  current: '1.0.0',
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
  ],
};

export const APP_INFO = {
  name: '病史分析考核系统',
  subtitle: '医院病史智能分析与考核平台',
  copyright: '© 2026',
};
