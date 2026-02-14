'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Activity, Calendar, TrendingUp, Search, 
  FileText, Download, RefreshCw, Hospital,
  Clock, AlertCircle, CheckCircle, BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface Stats {
  totalInpatients: number;
  totalOutpatients: number;
  todayAdmissions: number;
  todayDischarges: number;
  departmentDistribution: { ksdm: number; count: number }[];
  monthlyTrends: { month: string; count: number }[];
  diagnosisDistribution: { diagnosis: string; count: number }[];
}

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
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchStats();
    fetchPatients();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPatients = async (keyword = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients?keyword=${keyword}&pageSize=20`);
      const data = await res.json();
      if (data.success) {
        setPatients(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(searchKeyword);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getGender = (xb: number) => {
    return xb === 1 ? '男' : xb === 0 ? '女' : '未知';
  };

  const getStatus = (djzt: number) => {
    if (djzt === 1) return { text: '在院', color: 'text-green-600', bg: 'bg-green-100' };
    if (djzt === 0) return { text: '出院', color: 'text-gray-600', bg: 'bg-gray-100' };
    return { text: '未知', color: 'text-yellow-600', bg: 'bg-yellow-100' };
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
                onClick={() => { fetchStats(); fetchPatients(searchKeyword); }}
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
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">住院患者总数</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats.totalInpatients.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">门诊就诊总数</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats.totalOutpatients.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">今日入院</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats.todayAdmissions}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">今日出院</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats.todayDischarges}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trends */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">月度入院趋势</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                        name="入院人数"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Diagnosis Distribution */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">诊断分布 (Top 10)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.diagnosisDistribution.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis 
                        dataKey="diagnosis" 
                        type="category" 
                        width={100}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="病例数" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8" />
                  <div>
                    <p className="text-blue-100">病历完整率</p>
                    <p className="text-3xl font-bold">87.5%</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-8 h-8" />
                  <div>
                    <p className="text-green-100">待审核病历</p>
                    <p className="text-3xl font-bold">23</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8" />
                  <div>
                    <p className="text-purple-100">平均评分</p>
                    <p className="text-3xl font-bold">92.3</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜索患者姓名、卡号、住院号、身份证号..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  搜索
                </button>
              </div>
            </form>

            {/* Patients Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">姓名</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">性别</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">出生年月</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">卡号</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">住院号</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">入院日期</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">入院诊断</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">类型</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                        加载中...
                      </td>
                    </tr>
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                        未找到患者记录
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient, idx) => {
                      const status = getStatus(patient.djzt);
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">{patient.xm}</td>
                          <td className="px-6 py-4 text-slate-600">{getGender(patient.xb)}</td>
                          <td className="px-6 py-4 text-slate-600">{formatDate(patient.csny)}</td>
                          <td className="px-6 py-4 text-slate-600 font-mono text-sm">{patient.kh}</td>
                          <td className="px-6 py-4 text-slate-600 font-mono text-sm">{patient.zyh || '-'}</td>
                          <td className="px-6 py-4 text-slate-600">{formatDate(patient.ryrq)}</td>
                          <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{patient.ryzd || '-'}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {patient.jzlx}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 ${status.bg} ${status.color} text-xs font-medium rounded`}>
                              {status.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assessments Tab */}
        {activeTab === 'assessments' && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">考核评分模块</h3>
            <p className="text-slate-500 mb-4">正在建设中，敬请期待...</p>
            <div className="flex justify-center gap-4">
              <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600">
                病历完整性评分
              </div>
              <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600">
                诊断准确性评估
              </div>
              <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600">
                书写规范性检查
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
            <Download className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">报表导出模块</h3>
            <p className="text-slate-500 mb-4">正在建设中，敬请期待...</p>
            <div className="flex justify-center gap-4">
              <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600">
                Excel 导出
              </div>
              <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600">
                PDF 报表
              </div>
              <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600">
                数据可视化
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
