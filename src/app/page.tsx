'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Calendar, Search, RefreshCw, Hospital,
  ChevronLeft, ChevronRight, Filter, X,
  User, Stethoscope, Pill, DollarSign,
  StickyNote, Phone, MapPin, IdCard
} from 'lucide-react';

interface Patient {
  zlh: number;
  xm: string;
  xb_text: string;
  csny: string;
  sfz: string;
  lxdh: string;
  dz: string;
  ryrq: string;
  ryzd: string;
  zddm: string;
  zhushu: string;
  ssy: number;
  szy: number;
  fymc: string;
  ghf: number;
  cfje: number;
  cf_count: number;
  yp_count: number;
  status: string;
}

interface PatientDetail {
  basic: any;
  prescriptions: any[];
  prescriptionDetails: any[];
  feeSummary: any;
}

export default function Home() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 日期范围筛选 - 默认当月1号至今
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  
  // 分页
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // 患者详情弹窗
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [startDate, endDate, page]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        keyword: searchKeyword,
        startDate,
        endDate,
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
    if (!dateStr || dateStr === 'null') return '-';
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN');
    } catch {
      return '-';
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr || dateStr === 'null') return '-';
    try {
      return new Date(dateStr).toLocaleString('zh-CN');
    } catch {
      return '-';
    }
  };

  const formatText = (text: any) => {
    if (!text || text === 'null') return '-';
    const str = String(text).trim();
    return str || '-';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Hospital className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">门诊病史分析系统</h1>
                <p className="text-sm text-gray-500">门诊病史智能分析与考核平台</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => fetchPatients()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="刷新"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('zh-CN', { 
                  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 搜索区域 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">快速筛选：</span>
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
                className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-md transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">开始日期：</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">结束日期：</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索患者姓名、身份证号、诊断名称..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              搜索
            </button>
          </form>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">时间范围</p>
                <p className="text-sm font-semibold text-gray-900">{startDate} 至 {endDate}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">就诊人数</p>
                <p className="text-sm font-semibold text-gray-900">{total} 人</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">处方总额</p>
                <p className="text-sm font-semibold text-gray-900">
                  ¥ {patients.reduce((sum, p) => sum + (p.cfje || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">处方数量</p>
                <p className="text-sm font-semibold text-gray-900">
                  {patients.reduce((sum, p) => sum + (p.cf_count || 0), 0)} 张
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 患者列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900">门诊病史记录</h3>
            <p className="text-xs text-gray-500">点击任意行查看详细病史信息</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">姓名</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">性别</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">年龄</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">就诊日期</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">诊断</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">诊断代码</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">处方金额</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        加载中...
                      </div>
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-gray-500">
                      未找到门诊记录
                    </td>
                  </tr>
                ) : (
                  patients.map((patient, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => handlePatientClick(patient)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900">{formatText(patient.xm)}</div>
                        <div className="text-xs text-gray-500">{formatText(patient.sfz)}</div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">{formatText(patient.xb_text)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">
                        {patient.csny ? Math.floor((new Date().getTime() - new Date(patient.csny).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '-'}岁
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">
                        <div>{formatDate(patient.ryrq)}</div>
                        <div className="text-xs text-gray-400">{formatDateTime(patient.ryrq).split(' ')[1] || ''}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="max-w-[200px] text-sm text-gray-900 truncate" title={formatText(patient.ryzd)}>
                          {formatText(patient.ryzd)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm font-mono text-gray-600">{formatText(patient.zddm)}</td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">
                        {patient.cfje ? `¥ ${patient.cfje.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          {formatText(patient.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* 分页 */}
          {total > pageSize && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-md text-sm text-gray-700"
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" /> 上一页
              </button>
              <span className="text-sm text-gray-600">
                第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= total}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-md text-sm text-gray-700"
              >
                下一页 <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 患者详情弹窗 */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* 弹窗头部 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {formatText(selectedPatient.basic.xm)}
                  </h2>
                  <p className="text-blue-100 text-sm">门诊病史详情</p>
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
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  <User className="w-5 h-5 text-blue-600" />
                  基本信息
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">姓名</p>
                    <p className="font-semibold text-gray-900">{formatText(selectedPatient.basic.xm)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">性别</p>
                    <p className="font-semibold text-gray-900">{formatText(selectedPatient.basic.xb_text)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">出生年月</p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedPatient.basic.csny)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">联系电话</p>
                    <p className="font-semibold text-gray-900">{formatText(selectedPatient.basic.lxdh)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                    <p className="text-xs text-gray-500 mb-1">身份证号</p>
                    <p className="font-semibold text-gray-900 font-mono">{formatText(selectedPatient.basic.sfz)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                    <p className="text-xs text-gray-500 mb-1">家庭地址</p>
                    <p className="font-semibold text-gray-900 text-sm">{formatText(selectedPatient.basic.dz)}</p>
                  </div>
                </div>
              </div>

              {/* 诊断信息 */}
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  诊断信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">诊断名称</p>
                    <p className="font-semibold text-gray-900">{formatText(selectedPatient.basic.ryzd)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">诊断代码</p>
                    <p className="font-semibold text-gray-900 font-mono">{formatText(selectedPatient.basic.zddm)}</p>
                  </div>
                </div>
              </div>

              {/* 主诉/现病史 */}
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  <StickyNote className="w-5 h-5 text-blue-600" />
                  主诉/现病史
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900">{formatText(selectedPatient.basic.zhushu)}</p>
                </div>
              </div>

              {/* 费用汇总 */}
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  费用汇总
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">处方数量</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedPatient.feeSummary?.cf_count || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">处方总金额</p>
                    <p className="text-2xl font-bold text-green-600">
                      ¥ {(selectedPatient.feeSummary?.total_cfje || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">挂号费</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ¥ {(selectedPatient.feeSummary?.total_ghf || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 处方列表 */}
              {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 && (
                <div className="mb-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    <Pill className="w-5 h-5 text-blue-600" />
                    处方列表 ({selectedPatient.prescriptions.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-600 font-medium">处方号</th>
                          <th className="px-3 py-2 text-left text-gray-600 font-medium">开方时间</th>
                          <th className="px-3 py-2 text-left text-gray-600 font-medium">开方科室</th>
                          <th className="px-3 py-2 text-right text-gray-600 font-medium">处方金额</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedPatient.prescriptions.map((cf: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-mono text-gray-600">{cf.cfxh}</td>
                            <td className="px-3 py-2 text-gray-600">{formatDateTime(cf.cfrq)}</td>
                            <td className="px-3 py-2 text-gray-600">{cf.cfzxksdm}</td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900">
                              ¥ {cf.cfje?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 处方明细 */}
              {selectedPatient.prescriptionDetails && selectedPatient.prescriptionDetails.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    处方明细 ({selectedPatient.prescriptionDetails.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-600 font-medium">项目名称</th>
                          <th className="px-3 py-2 text-left text-gray-600 font-medium">规格</th>
                          <th className="px-3 py-2 text-center text-gray-600 font-medium">数量</th>
                          <th className="px-3 py-2 text-left text-gray-600 font-medium">用法</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedPatient.prescriptionDetails.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-gray-900">{formatText(item.cfxmmc)}</td>
                            <td className="px-3 py-2 text-gray-600 text-xs">{formatText(item.Mzgg)}</td>
                            <td className="px-3 py-2 text-center text-gray-600">{item.sl || 0}</td>
                            <td className="px-3 py-2 text-gray-600 text-xs">
                              {formatText(item.ypsypldm)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 加载中弹窗 */}
      {detailLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-xl">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 mt-4 text-center">加载中...</p>
          </div>
        </div>
      )}
    </div>
  );
}
