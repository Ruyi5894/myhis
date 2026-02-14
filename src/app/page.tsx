'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Activity, Calendar, TrendingUp, Search, 
  FileText, Download, RefreshCw, Hospital,
  Clock, AlertCircle, CheckCircle, BarChart3,
  ChevronLeft, ChevronRight, Filter, X,
  User, Stethoscope, Pill, FileCheck, DollarSign
} from 'lucide-react';

interface Patient {
  zlh: number;
  xm: string;
  xb: number;
  csny: string;
  kh: string;
  zyh: string;
  ryrq: string;
  cyrq: string | null;
  ryzd: string;
  ryks: number;
  jzlx: string;
  djzt: number;
  days: number;
  status: string;
}

interface PatientDetail {
  type: string;
  basic: any;
  fees: any[];
}

export default function Home() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('patients');
  
  // 日期范围筛选 - 默认当月1号至今
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [patientType, setPatientType] = useState('all');
  
  // 分页
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // 患者详情弹窗
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [startDate, endDate, patientType, page]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        keyword: searchKeyword,
        startDate,
        endDate,
        type: patientType,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      const res = await fetch(`/api/patients?${params}`);
      const data = await res.json();
      if (data.success) {
        setPatients(data.data);
        setTotal(data.total);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  // 点击患者查看详情
  const handlePatientClick = async (patient: Patient) => {
    setSelectedPatient(null);
    setDetailLoading(true);
    
    try {
      const res = await fetch(`/api/patients/${patient.zlh}`);
      const data = await res.json();
      if (data.success) {
        setSelectedPatient(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch patient detail:', error);
    }
    
    setDetailLoading(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const getGender = (xb: number) => {
    return xb === 1 ? '男' : xb === 0 ? '女' : '未知';
  };

  // 快捷日期按钮
  const setQuickDateRange = (range: string) => {
    const today = new Date();
    let start: Date;
    let end: Date = today;
    
    switch (range) {
      case 'today':
        start = today;
        break;
      case 'week':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarter':
        start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Hospital className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">病史分析考核系统</h1>
                <p className="text-sm text-slate-500">医院病史智能分析与考核平台</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => fetchPatients()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-slate-600" />
              </button>
              <div className="text-sm text-slate-500">
                {new Date().toLocaleDateString('zh-CN', { 
                  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1">
            {[
              { id: 'dashboard', label: '数据看板', icon: BarChart3 },
              { id: 'patients', label: '患者查询', icon: Users },
              { id: 'assessments', label: '考核评分', icon: FileText },
              { id: 'reports', label: '报表导出', icon: Download },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            {/* 搜索和筛选区域 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">快速筛选：</span>
                {[
                  { label: '今日', value: 'today' },
                  { label: '最近7天', value: 'week' },
                  { label: '本月', value: 'month' },
                  { label: '本季度', value: 'quarter' },
                  { label: '本年', value: 'year' },
                ].map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => setQuickDateRange(btn.value)}
                    className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-wrap items-end gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">开始日期：</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">结束日期：</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">类型：</label>
                  <select
                    value={patientType}
                    onChange={(e) => { setPatientType(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">全部</option>
                    <option value="inpatient">住院</option>
                    <option value="outpatient">门诊</option>
                  </select>
                </div>
              </div>
              
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜索患者姓名、卡号、住院号..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  搜索
                </button>
              </form>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">时间范围</p>
                    <p className="text-sm font-semibold text-slate-800">{startDate} 至 {endDate}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">住院记录</p>
                    <p className="text-sm font-semibold text-slate-800">{patients.filter(p => p.jzlx === '住院').length} 条</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Activity className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">门诊记录</p>
                    <p className="text-sm font-semibold text-slate-800">{patients.filter(p => p.jzlx === '门诊').length} 条</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">记录总数</p>
                    <p className="text-sm font-semibold text-slate-800">{patients.length} 条</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 患者列表 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-800">病史记录列表</h3>
                <p className="text-sm text-slate-500">点击任意行查看详细病史信息</p>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">类型</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">姓名</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">性别</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">出生年月</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">卡号</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">住院号</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">入院日期</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">出院日期</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">天数</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">入院诊断</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                        加载中...
                      </td>
                    </tr>
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                        未找到病史记录
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => handlePatientClick(patient)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            patient.jzlx === '住院' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {patient.jzlx}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{patient.xm}</td>
                        <td className="px-4 py-3 text-slate-600">{getGender(patient.xb)}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{formatDate(patient.csny)}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-sm">{patient.kh?.trim() || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-sm">{patient.zyh?.trim() || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{formatDate(patient.ryrq)}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{formatDate(patient.cyrq)}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{patient.days || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate text-sm">{patient.ryzd?.trim() || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            patient.status === '在院' 
                              ? 'bg-green-100 text-green-700' 
                              : patient.status === '已完成'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {patient.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {/* 分页 */}
              {total > pageSize && (
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg text-sm"
                  >
                    <ChevronLeft className="w-4 h-4 inline" /> 上一页
                  </button>
                  <span className="text-sm text-slate-600">
                    第 {page} 页
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page * pageSize >= total}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg text-sm"
                  >
                    下一页 <ChevronRight className="w-4 h-4 inline" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">数据看板</h3>
            <p className="text-slate-500">点击"患者查询"标签查看详细病史记录</p>
          </div>
        )}

        {/* Assessments Tab */}
        {activeTab === 'assessments' && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">考核评分模块</h3>
            <p className="text-slate-500 mb-4">正在建设中，敬请期待...</p>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
            <Download className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">报表导出模块</h3>
            <p className="text-slate-500 mb-4">正在建设中，敬请期待...</p>
          </div>
        )}
      </main>

      {/* 患者详情弹窗 */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* 弹窗头部 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedPatient.basic.xm || '患者详情'}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {selectedPatient.type === 'inpatient' ? '住院病史' : '门诊记录'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            
            {/* 弹窗内容 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* 基本信息 */}
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  基本信息
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">姓名</p>
                    <p className="font-semibold text-slate-800">{selectedPatient.basic.xm || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">性别</p>
                    <p className="font-semibold text-slate-800">{getGender(selectedPatient.basic.xb)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">出生年月</p>
                    <p className="font-semibold text-slate-800">{formatDate(selectedPatient.basic.csny)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">卡号</p>
                    <p className="font-semibold text-slate-800 font-mono">{selectedPatient.basic.kh?.trim() || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">住院号</p>
                    <p className="font-semibold text-slate-800 font-mono">{selectedPatient.basic.zyh?.trim() || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">入院日期</p>
                    <p className="font-semibold text-slate-800">{formatDateTime(selectedPatient.basic.ryrq)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">出院日期</p>
                    <p className="font-semibold text-slate-800">{formatDateTime(selectedPatient.basic.cyrq) || '在院'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">住院天数</p>
                    <p className="font-semibold text-slate-800">{selectedPatient.basic.days || 0} 天</p>
                  </div>
                </div>
              </div>

              {/* 诊断信息 */}
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  诊断信息
                </h3>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">入院诊断</p>
                      <p className="font-semibold text-slate-800">{selectedPatient.basic.ryzd?.trim() || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">当前状态</p>
                      <span className={`inline-block px-2 py-1 text-sm font-medium rounded ${
                        selectedPatient.basic.status === '在院' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedPatient.basic.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 费用信息 */}
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  费用明细
                </h3>
                {selectedPatient.fees && selectedPatient.fees.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-slate-600">发票号</th>
                          <th className="px-4 py-2 text-left text-slate-600">结算序号</th>
                          <th className="px-4 py-2 text-left text-slate-600">结算时间</th>
                          <th className="px-4 py-2 text-right text-slate-600">总金额</th>
                          <th className="px-4 py-2 text-right text-slate-600">现金支付</th>
                          <th className="px-4 py-2 text-right text-slate-600">记账金额</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPatient.fees.map((fee: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 font-mono text-slate-600">{fee.Fph || '-'}</td>
                            <td className="px-4 py-2 text-slate-600">{fee.Jsxh || '-'}</td>
                            <td className="px-4 py-2 text-slate-600">{formatDateTime(fee.Jssj)}</td>
                            <td className="px-4 py-2 text-right font-medium text-slate-800">{fee.Zje?.toFixed(2) || '0.00'}</td>
                            <td className="px-4 py-2 text-right text-slate-600">{fee.Xjzje?.toFixed(2) || '0.00'}</td>
                            <td className="px-4 py-2 text-right text-slate-600">{fee.Jzje?.toFixed(2) || '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-500">
                    暂无费用明细
                  </div>
                )}
              </div>

              {/* 治疗措施 */}
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
                  <Pill className="w-5 h-5 text-blue-600" />
                  治疗措施
                </h3>
                <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-500">
                  治疗措施记录功能开发中...
                </div>
              </div>

              {/* 出院信息 */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  出院信息
                </h3>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">出院日期</p>
                      <p className="font-semibold text-slate-800">{formatDateTime(selectedPatient.basic.cyrq) || '在院中'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">出院方式</p>
                      <p className="font-semibold text-slate-800">
                        {selectedPatient.basic.cyfs === 1 ? '医嘱出院' : 
                         selectedPatient.basic.cyfs === 2 ? '自动出院' : 
                         selectedPatient.basic.cyfs === 3 ? '转院' : '未出院'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 加载中弹窗 */}
      {detailLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-slate-600 mt-4">加载中...</p>
          </div>
        </div>
      )}
    </div>
  );
}
