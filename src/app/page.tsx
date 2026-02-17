'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, Search, RefreshCw, Hospital,
  ChevronLeft, ChevronRight, Filter, X,
  User, Stethoscope, Pill, DollarSign,
  StickyNote, Activity, ClipboardList, Star, Settings, AlertTriangle, Sparkles
} from 'lucide-react';
import SCORING_CONFIG from '@/config/scoring';

interface ScoringCategory {
  id: string;
  name: string;
  weight: number;
  description: string;
}

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
  ksdm: string;
  ksdm_text: string;
  fymc: string;
  ghf: number;
  cfje: number;
  cf_count: number;
  yp_count: number;
  doctor_name: string;
  doctor_code: string;
}

interface PatientDetail {
  zlh?: number;
  basicInfo: {
    zlh?: number;
    name: string;
    gender: string;
    age: string;
    cardNo: string;
    phone: string;
    address: string;
    occupation: string;
    visitDate: string;
    dept: string;
  };
  medicalRecord: {
    chiefComplaint: string;
    presentIllness: string;
    pastHistory: string;
    physicalExam: string;
    preliminaryDiagnosis: string;
    diagnosisCode: string;
    diagnoses?: string[];  // 新增：多个诊断
    diagnosisCodes?: string[];  // 新增：多个诊断代码
    treatment: string;
  };
  vitalSigns: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
  };
  signature: {
    doctor: string;
    signDate: string;
  };
  prescriptions: any[];
  prescriptionDetails: any[];
  feeSummary: any;
}

export default function Home() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [excludeSimple, setExcludeSimple] = useState(true);
  const [selectedDept, setSelectedDept] = useState('3120'); // 全科
  const [departments, setDepartments] = useState<{Ksdm: string; Ksmc: string}[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [doctors, setDoctors] = useState<{Ygdm: string; doctor_name: string}[]>([]);
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  
  // 排序状态
  const [sortField, setSortField] = useState<string>('zdrq');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // 评分相关状态
  const [showScoringSettings, setShowScoringSettings] = useState(false);
  const [scoringWeights, setScoringWeights] = useState<ScoringCategory[]>(
    SCORING_CONFIG.categories.map(c => ({ ...c }))
  );
  const [scoringResult, setScoringResult] = useState<any>(null);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [selectedPatientForScoring, setSelectedPatientForScoring] = useState<PatientDetail | null>(null);
  const [medicationAnalysis, setMedicationAnalysis] = useState<any>(null);
  const [medicationAnalysisLoading, setMedicationAnalysisLoading] = useState(false);
  const [aiMedicationAnalysis, setAiMedicationAnalysis] = useState<any>(null);
  const [aiMedicationAnalysisLoading, setAiMedicationAnalysisLoading] = useState(false);
  const [medVerifyResult, setMedVerifyResult] = useState<any>(null);
  const [medVerifyLoading, setMedVerifyLoading] = useState(false);

  // 获取科室列表 - 从搜索结果中动态获取
  useEffect(() => {
    // 科室列表从搜索结果中获取，这里不需要单独调用
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [startDate, endDate, page, excludeSimple, selectedDept, selectedDoctor, sortField, sortOrder]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        keyword: searchKeyword,
        startDate,
        endDate,
        page: page.toString(),
        pageSize: pageSize.toString(),
        excludeSimple: excludeSimple.toString(),
        dept: selectedDept,
        doctor: selectedDoctor,
        sortField,
        sortOrder,
      });
      const res = await fetch(`/api/patients?${params}`);
      const data = await res.json();
      if (data.success) {
        setPatients(data.data);
        setTotal(data.total);
        // 从搜索结果中获取科室和医生列表
        if (data.departments) {
          setDepartments(data.departments);
        }
        if (data.doctors) {
          setDoctors(data.doctors);
        }
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

  // 获取用药分析
  const fetchMedicationAnalysis = async (zlh: number) => {
    setMedicationAnalysisLoading(true);
    setMedicationAnalysis(null);
    setAiMedicationAnalysis(null);
    try {
      const res = await fetch(`/api/patients/${zlh}/medicationAnalysis`);
      const data = await res.json();
      if (data.success) {
        setMedicationAnalysis(data.data);
      } else {
        console.error('用药分析失败:', data.error);
      }
    } catch (error) {
      console.error('获取用药分析失败:', error);
    }
    setMedicationAnalysisLoading(false);
  };

  // AI用药合理性分析
  const fetchAIMedicationAnalysis = async (zlh: number) => {
    setAiMedicationAnalysisLoading(true);
    setAiMedicationAnalysis(null);
    try {
      const res = await fetch(`/api/patients/${zlh}/medicationAnalysis/ai`);
      const data = await res.json();
      if (data.success) {
        setAiMedicationAnalysis(data.data);
      } else {
        console.error('AI用药分析失败:', data.error);
      }
    } catch (error) {
      console.error('获取AI用药分析失败:', error);
    }
    setAiMedicationAnalysisLoading(false);
  };

  // 用药数据验证（AI核实剂量是否正确）
  const fetchMedVerify = async (zlh: number) => {
    setMedVerifyLoading(true);
    setMedVerifyResult(null);
    try {
      const res = await fetch(`/api/patients/${zlh}/medicationAnalysis/verify`);
      const data = await res.json();
      if (data.success) {
        setMedVerifyResult(data.data);
      } else {
        console.error('用药验证失败:', data.error);
      }
    } catch (error) {
      console.error('获取用药验证失败:', error);
    }
    setMedVerifyLoading(false);
  };

  // 排序处理
  const handleSort = (field: string) => {
    if (sortField === field) {
      // 相同字段，反转排序方向
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 不同字段，默认降序
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

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

  // 评分函数
  const handleScorePatient = async (patient: PatientDetail, force = false) => {
    setSelectedPatientForScoring(patient);
    setScoringResult(null);
    setScoringLoading(true);
    
    try {
      const response = await fetch('/api/scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientData: {
            name: patient.basicInfo.name,
            gender: patient.basicInfo.gender,
            age: patient.basicInfo.age,
            visitDate: patient.basicInfo.visitDate,
            dept: patient.basicInfo.dept,
            chiefComplaint: patient.medicalRecord.chiefComplaint,
            presentIllness: patient.medicalRecord.presentIllness,
            pastHistory: patient.medicalRecord.pastHistory,
            physicalExam: patient.medicalRecord.physicalExam,
            diagnosis: patient.medicalRecord.diagnoses?.join('; ') || patient.medicalRecord.preliminaryDiagnosis,
            treatment: patient.medicalRecord.treatment,
          },
          weights: scoringWeights.map(c => `${c.name}（${c.weight}分）：${c.description}`),
          zlh: patient.basicInfo.cardNo?.slice(-8),  // 病历号后8位作为唯一标识
          force: force,  // 是否强制重新评分
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setScoringResult(data.data);
      } else {
        alert('评分失败: ' + data.error);
      }
    } catch (error) {
      console.error('评分失败:', error);
      alert('评分失败，请重试');
    }
    
    setScoringLoading(false);
  };

  // 更新权重
  const updateWeight = (id: string, weight: number) => {
    setScoringWeights(prev => prev.map(c => 
      c.id === id ? { ...c, weight } : c
    ));
  };

  // 计算总权重
  const totalWeight = scoringWeights.reduce((sum, c) => sum + c.weight, 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'null' || dateStr === '-') return '-';
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN');
    } catch {
      return '-';
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr || dateStr === 'null' || dateStr === '-') return '-';
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

  // 计算用药天数
  const calculateDays = (item: any): { days: string; detail: string } => {
    const sl = parseFloat(item.sl) || 0;
    const ypyl = parseFloat(item.ypyl) || 0;
    const ypyf = item.ypsypldm?.trim().toUpperCase() || '';
    const mzgg = item.Mzgg || '';
    
    // 如果无法计算
    if (!ypyl || ypyf === 'PRN' || ypyf === 'SOS' || ypyf === 'ST') {
      return { days: '-', detail: '无法计算：必要时/立即用药' };
    }
    
    // 解析每盒/瓶片数
    let pillsPerBox = 1;
    const boxMatch = mzgg.match(/(\d+)\s*片/);
    if (boxMatch) {
      pillsPerBox = parseInt(boxMatch[1], 10);
    }
    
    // 计算总片数
    const totalPills = sl * pillsPerBox;
    
    // 计算每日片数
    let timesPerDay = 1;
    let timesText = '每日1次';
    if (ypyf.includes('QD') || ypyf === '1' || ypyf === 'QN') {
      timesPerDay = 1;
      timesText = '每日1次(QD)';
    } else if (ypyf.includes('BID') || ypyf === '2') {
      timesPerDay = 2;
      timesText = '每日2次(BID)';
    } else if (ypyf.includes('TID') || ypyf === '3') {
      timesPerDay = 3;
      timesText = '每日3次(TID)';
    } else if (ypyf.includes('QID') || ypyf === '4') {
      timesPerDay = 4;
      timesText = '每日4次(QID)';
    }
    
    // 每日剂量(mg) = 每日片数 * 每片剂量
    const jl = parseFloat(item.Jl) || 0;
    const dailyDoseMg = timesPerDay * jl;
    
    if (dailyDoseMg <= 0) {
      return { days: '-', detail: '无法计算：剂量数据异常' };
    }
    
    // 可用天数 = 总mg / 每日mg
    const totalMg = totalPills * jl;
    const days = totalMg / dailyDoseMg;
    
    const daysStr = days < 1 ? Math.round(days * 10) / 10 + '天' : Math.round(days) + '天';
    
    const detail = `计算步骤：
1. 数量 × 每盒片数 = ${sl} × ${pillsPerBox} = ${totalPills}片（总片数）
2. ${totalPills}片 × ${jl}mg = ${totalMg}mg（总剂量）
3. ${timesText} × ${jl}mg = ${dailyDoseMg}mg（每日剂量）
4. ${totalMg}mg ÷ ${dailyDoseMg}mg = ${daysStr}`;
    
    return { days: daysStr, detail };
  };

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
                <p className="text-sm text-gray-500">依据国家卫健委规范</p>
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
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">科室：</label>
              <select
                value={selectedDept}
                onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-[120px]"
              >
                <option value="">全部科室</option>
                {departments.map((dept) => (
                  <option key={dept.Ksdm} value={dept.Ksdm}>
                    {dept.Ksmc || dept.Ksdm}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">医生：</label>
              <select
                value={selectedDoctor}
                onChange={(e) => { setSelectedDoctor(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-[120px]"
              >
                <option value="">全部医生</option>
                {doctors.map((doc) => (
                  <option key={doc.Ygdm} value={doc.Ygdm}>
                    {doc.doctor_name || doc.Ygdm}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeSimple}
                  onChange={(e) => { setExcludeSimple(e.target.checked); setPage(1); }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  排除简易门诊（复诊，配药等）
                </span>
              </label>
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
                <User className="w-5 h-5 text-orange-600" />
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
                <Pill className="w-5 h-5 text-purple-600" />
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
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">科室</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">性别</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">年龄</th>
                  <th 
                    className="text-left px-3 py-2.5 text-xs font-medium text-gray-600 cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort('zdrq')}
                  >
                    就诊日期 {sortField === 'zdrq' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">诊断</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">诊断代码</th>
                  <th 
                    className="text-left px-3 py-2.5 text-xs font-medium text-gray-600 cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort('cfje')}
                  >
                    处方金额 {sortField === 'cfje' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-left px-3 py-2.5 text-xs font-medium text-gray-600 cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort('doctor_name')}
                  >
                    医生 {sortField === 'doctor_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        加载中...
                      </div>
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-12 text-center text-gray-500">
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
                      <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatText(patient.ksdm_text) || '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{formatText(patient.xb_text)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
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
                      <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatText(patient.doctor_name) || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
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

      {/* 门诊病历详情弹窗 - 按卫健委规范显示 */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* 弹窗头部 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">门诊病历</h2>
                  <p className="text-blue-100 text-sm">依据国家卫健委规范</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleScorePatient(selectedPatient)}
                  disabled={scoringLoading}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Star className="w-4 h-4" />
                  {scoringLoading ? '评分中...' : 'AI评分'}
                </button>
                <button 
                  onClick={() => setShowScoringSettings(true)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="评分设置"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
            
            {/* 弹窗内容 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              
              {/* 一、门诊病历首页 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <h3 className="text-lg font-semibold text-gray-900">门诊病历首页</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">姓名</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.basicInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">性别</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.basicInfo.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">年龄</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.basicInfo.age}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">就诊日期</p>
                      <p className="font-semibold text-gray-900">{formatDate(selectedPatient.basicInfo.visitDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">联系电话</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.basicInfo.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">身份证号</p>
                      <p className="font-semibold text-gray-900 font-mono text-sm">{selectedPatient.basicInfo.cardNo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">职业</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.basicInfo.occupation}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">就诊科室</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.basicInfo.dept}</p>
                    </div>
                    <div className="col-span-2 md:col-span-4">
                      <p className="text-xs text-gray-500">家庭地址</p>
                      <p className="font-semibold text-gray-900 text-sm">{selectedPatient.basicInfo.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 二、病历记录 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <h3 className="text-lg font-semibold text-gray-900">病历记录</h3>
                </div>
                
                <div className="space-y-4">
                  {/* 主诉 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <StickyNote className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">主诉</span>
                    </div>
                    <p className="text-gray-900">{selectedPatient.medicalRecord.chiefComplaint}</p>
                  </div>

                  {/* 现病史 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <StickyNote className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">现病史</span>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedPatient.medicalRecord.presentIllness}</p>
                  </div>

                  {/* 既往史 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardList className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">既往史</span>
                    </div>
                    <p className="text-gray-500 italic">{selectedPatient.medicalRecord.pastHistory}</p>
                  </div>

                  {/* 体格检查 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">体格检查</span>
                    </div>
                    <p className="text-gray-900">{selectedPatient.medicalRecord.physicalExam}</p>
                  </div>

                  {/* 初步诊断 - 支持多个诊断 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">初步诊断</span>
                      {selectedPatient.medicalRecord.diagnoses && selectedPatient.medicalRecord.diagnoses.length > 1 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          共{selectedPatient.medicalRecord.diagnoses.length}个
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {selectedPatient.medicalRecord.diagnoses && selectedPatient.medicalRecord.diagnoses.length > 0 ? (
                        selectedPatient.medicalRecord.diagnoses.map((diag, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="font-semibold text-gray-900">{idx + 1}. {diag}</span>
                            {selectedPatient.medicalRecord.diagnosisCodes && selectedPatient.medicalRecord.diagnosisCodes[idx] && (
                              <span className="text-xs text-gray-500 font-mono">
                                ({selectedPatient.medicalRecord.diagnosisCodes[idx]})
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="font-semibold text-gray-900">{selectedPatient.medicalRecord.preliminaryDiagnosis}</p>
                      )}
                    </div>
                  </div>

                  {/* 处理措施 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">处理措施</span>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedPatient.medicalRecord.treatment}</p>
                  </div>
                </div>
              </div>

              {/* 三、生命体征 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <h3 className="text-lg font-semibold text-gray-900">生命体征</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">血压</p>
                    <p className="text-xl font-bold text-gray-900">{selectedPatient.vitalSigns.bloodPressure}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">心率/脉搏</p>
                    <p className="text-xl font-bold text-gray-900">{selectedPatient.vitalSigns.heartRate}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">体温</p>
                    <p className="text-xl font-bold text-gray-900">{selectedPatient.vitalSigns.temperature}</p>
                  </div>
                </div>
              </div>

              {/* 四、医师签名 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <h3 className="text-lg font-semibold text-gray-900">医师签名</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">医师签名</p>
                    <p className="font-semibold text-gray-900">{selectedPatient.signature.doctor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">签名日期</p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedPatient.signature.signDate)}</p>
                  </div>
                </div>
              </div>

              {/* 五、处方信息 */}
              {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                    <h3 className="text-lg font-semibold text-gray-900">处方信息</h3>
                  </div>
                  
                  {/* 费用汇总 */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
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

                  {/* 处方列表 */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-700">处方列表</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-600">处方号</th>
                            <th className="px-4 py-2 text-left text-gray-600">开方时间</th>
                            <th className="px-4 py-2 text-left text-gray-600">开方科室</th>
                            <th className="px-4 py-2 text-right text-gray-600">处方金额</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedPatient.prescriptions.map((cf: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 font-mono text-gray-600">{cf.cfxh}</td>
                              <td className="px-4 py-2 text-gray-600">{formatDateTime(cf.cfrq)}</td>
                              <td className="px-4 py-2 text-gray-600">{cf.cfzxksdm}</td>
                              <td className="px-4 py-2 text-right font-medium text-gray-900">
                                ¥ {cf.cfje?.toFixed(2) || '0.00'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 处方明细 */}
                  {selectedPatient.prescriptionDetails && selectedPatient.prescriptionDetails.length > 0 && (
                    <div className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-700">处方明细</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-gray-600">项目名称</th>
                              <th className="px-4 py-2 text-left text-gray-600">规格</th>
                              <th className="px-4 py-2 text-center text-gray-600">数量</th>
                              <th className="px-4 py-2 text-left text-gray-600">用法</th>
                              <th className="px-4 py-2 text-center text-gray-600">每日用量</th>
                              <th className="px-4 py-2 text-center text-gray-600">可用天数</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedPatient.prescriptionDetails.map((item: any, idx: number) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 text-gray-900">{formatText(item.cfxmmc)}</td>
                                <td className="px-4 py-2 text-gray-600 text-xs">{formatText(item.Mzgg)}</td>
                                <td className="px-4 py-2 text-center text-gray-600">{item.sl || 0}</td>
                                <td className="px-4 py-2 text-gray-600 text-xs">
                                  {formatText(item.ypsypldm)}
                                </td>
                                <td className="px-4 py-2 text-center text-gray-600">
                                  {item.ypyl ? item.ypyl + 'mg' : '-'}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {(() => {
                                    const { days, detail } = calculateDays(item);
                                    return days === '-' ? (
                                      <span className="text-gray-400">{days}</span>
                                    ) : (
                                      <span 
                                        className="text-blue-600 font-medium cursor-help border-b border-dashed border-blue-400"
                                        title={detail}
                                      >
                                        {days}
                                      </span>
                                    );
                                  })()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 用药分析 - 1年用药分析 */}
      {selectedPatient && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">用药分析</h3>
            </div>
            {!medicationAnalysis && !medicationAnalysisLoading && (
              <button
                onClick={() => {
                  const zlh = selectedPatient.basicInfo?.zlh || selectedPatient.zlh;
                  if (zlh) fetchMedicationAnalysis(zlh);
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                分析1年用药
              </button>
            )}
          </div>

          {medicationAnalysisLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">正在分析...</span>
            </div>
          )}

          {medicationAnalysis && !medicationAnalysisLoading && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">{medicationAnalysis.patientInfo?.visitCount || 0}</div>
                    <div className="text-xs text-gray-500">就诊次数</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">{medicationAnalysis.patientInfo?.prescriptionCount || 0}</div>
                    <div className="text-xs text-gray-500">处方次数</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">{medicationAnalysis.summary?.totalMedications || 0}</div>
                    <div className="text-xs text-gray-500">药品种类</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{medicationAnalysis.summary?.medicationsWithIssues || 0}</div>
                    <div className="text-xs text-red-500">有问题药品</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  分析区间: {medicationAnalysis.patientInfo?.analysisRange?.from} 至 {medicationAnalysis.patientInfo?.analysisRange?.to}
                </div>
              </div>

              {(medicationAnalysis.medicationIssues?.length > 0 || medicationAnalysis.sameTypeIssues?.length > 0) && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    用药问题预警
                  </h4>
                  {medicationAnalysis.medicationIssues?.map((issue: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 py-2 text-sm">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></span>
                      <span className="text-red-700">{issue.medication}: {issue.message}</span>
                    </div>
                  ))}
                  {medicationAnalysis.sameTypeIssues?.map((issue: any, idx: number) => (
                    <div key={`same-${idx}`} className="flex items-start gap-2 py-2 text-sm">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></span>
                      <span className="text-orange-700">{issue.message} ({issue.medications?.join('、')})</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-600">药品名称</th>
                      <th className="px-4 py-2 text-center text-gray-600">累计天数</th>
                      <th className="px-4 py-2 text-center text-gray-600">处方次数</th>
                      <th className="px-4 py-2 text-left text-gray-600">问题</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {medicationAnalysis.medications?.map((med: any, idx: number) => {
                      const hasIssue = med.issues?.length > 0 || med.totalDays > 365;
                      return (
                        <tr key={idx} className={hasIssue ? 'bg-red-50' : ''}>
                          <td className="px-4 py-2 text-gray-900">{med.name}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={med.totalDays > 365 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                              {med.totalDays}天
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center text-gray-600">{med.prescriptionCount}</td>
                          <td className="px-4 py-2 text-left">
                            {med.issues?.length > 0 && (
                              <span className="text-yellow-600 text-xs">{med.issues[0].message}</span>
                            )}
                            {med.totalDays > 365 && (
                              <span className="text-red-600 text-xs block">超过1年用量</span>
                            )}
                            {!med.issues?.length && med.totalDays <= 365 && (
                              <span className="text-green-600 text-xs">✓ 正常</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI用药分析按钮 */}
          {medicationAnalysis && !aiMedicationAnalysis && !aiMedicationAnalysisLoading && (
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => {
                  const zlh = selectedPatient.basicInfo?.zlh || selectedPatient.zlh;
                  if (zlh) fetchAIMedicationAnalysis(zlh);
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                AI智能分析用药
              </button>
              <button
                onClick={() => {
                  const zlh = selectedPatient.basicInfo?.zlh || selectedPatient.zlh;
                  if (zlh) fetchMedVerify(zlh);
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg"
              >
                <AlertTriangle className="w-5 h-5" />
                AI验证用药数据
              </button>
            </div>
          )}

          {aiMedicationAnalysisLoading && (
            <div className="mt-4 flex items-center justify-center py-6 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-purple-700">AI正在分析用药情况...</span>
            </div>
          )}

          {aiMedicationAnalysis && !aiMedicationAnalysisLoading && (
            <div className="mt-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
              <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI用药分析结果
              </h4>
              <div className="bg-white rounded-lg p-4 shadow-sm text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {aiMedicationAnalysis.analysis}
              </div>
            </div>
          )}

          {/* 用药数据验证结果 */}
          {medVerifyLoading && (
            <div className="mt-4 flex items-center justify-center py-6 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-orange-700">AI正在验证用药数据...</span>
            </div>
          )}

          {medVerifyResult && !medVerifyLoading && (
            <div className="mt-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-100">
              <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                用药数据AI验证结果
              </h4>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  {medVerifyResult.hasDosageError ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">⚠️ 发现数据异常</span>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">✓ 数据正常</span>
                  )}
                  <span className="text-sm text-gray-600">
                    可疑药品: {medVerifyResult.questionableCount}种
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">
                  <strong>结论：</strong>{medVerifyResult.conclusion}
                </p>
                
                <p className="text-sm text-orange-700 mb-3">
                  <strong>建议：</strong>{medVerifyResult.recommendation}
                </p>

                {medVerifyResult.verification && medVerifyResult.verification.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">详细验证：</p>
                    {medVerifyResult.verification.map((v: any, idx: number) => (
                      <div key={idx} className={`p-3 rounded-lg mb-2 ${v.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{v.medication}</span>
                          {v.isCorrect ? (
                            <span className="text-green-600 text-xs">✓ 正确</span>
                          ) : (
                            <span className="text-red-600 text-xs">⚠️ 需核实</span>
                          )}
                        </div>
                        {v.issue && <p className="text-sm text-red-600 mt-1">问题: {v.issue}</p>}
                        {v.correctDays && <p className="text-sm text-green-700">正确天数: {v.correctDays}天</p>}
                        {v.reason && <p className="text-xs text-gray-500 mt-1">理由: {v.reason}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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

      {/* AI评分结果弹窗 */}
      {scoringResult && selectedPatientForScoring && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">AI 病史评分结果</h2>
                  <p className="text-yellow-100 text-sm">基于卫健委评分标准</p>
                </div>
              </div>
              <button 
                onClick={() => setScoringResult(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* 总分 */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full shadow-lg ${scoringResult.isQualified ? 'bg-gradient-to-br from-green-400 to-green-500' : 'bg-gradient-to-br from-red-400 to-orange-500'}`}>
                  <span className="text-4xl font-bold text-white">{scoringResult.totalScore || 0}</span>
                  <span className="text-lg text-white/80 ml-1">分</span>
                </div>
                <p className="text-gray-600 mt-2">
                  总分（满分100分）
                  {scoringResult.cached && (
                    <span className="ml-2 text-green-600 text-sm">✓ 已缓存</span>
                  )}
                </p>
                {scoringResult.cached && (
                  <button 
                    onClick={() => selectedPatientForScoring && handleScorePatient(selectedPatientForScoring, true)}
                    disabled={scoringLoading}
                    className="mt-2 px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    {scoringLoading ? '重新评分中...' : '重新评分'}
                  </button>
                )}
                {scoringResult.errorCount !== undefined && (
                  <p className={`text-sm mt-1 ${scoringResult.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    发现 {scoringResult.errorCount} 个问题
                  </p>
                )}
              </div>

              {/* 错误列表 */}
              {scoringResult.criticalErrors && scoringResult.criticalErrors.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-red-700 mb-3">⚠️ 发现的问题</h3>
                  <div className="space-y-3">
                    {scoringResult.criticalErrors.map((err: any, idx: number) => (
                      <div key={idx} className={`rounded-lg p-4 ${err.type === '关键错误' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                        <div className="flex items-start gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${err.type === '关键错误' ? 'bg-red-200 text-red-700' : 'bg-yellow-200 text-yellow-700'}`}>
                            {err.type}
                          </span>
                          <span className="text-sm text-gray-600">{err.location}</span>
                        </div>
                        <p className="text-sm text-gray-800 mt-2">{err.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 亮点 */}
              {scoringResult.strengths && scoringResult.strengths.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-green-700 mb-2">✓ 病历亮点</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {scoringResult.strengths.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 改进建议 */}
              {scoringResult.suggestions && scoringResult.suggestions.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-blue-700 mb-2">→ 改进建议</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {scoringResult.suggestions.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 总结 */}
              {scoringResult.summary && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-700 mb-2">整体评价</h3>
                  <p className="text-sm text-gray-700">{scoringResult.summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 评分设置弹窗 */}
      {showScoringSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">评分权重设置</h2>
              </div>
              <button 
                onClick={() => setShowScoringSettings(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">评分项权重</h3>
                <span className={`text-sm font-medium ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  总权重: {totalWeight}/100
                </span>
              </div>
              
              <div className="space-y-4">
                {scoringWeights.map((category) => (
                  <div key={category.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={category.weight}
                          onChange={(e) => updateWeight(category.id, parseInt(e.target.value))}
                          className="w-24"
                        />
                        <span className="w-12 text-right font-medium text-gray-900">{category.weight}</span>
                        <span className="text-gray-500">分</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                ))}
              </div>

              {totalWeight !== 100 && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  ⚠️ 权重总和应为 100 分，当前为 {totalWeight} 分
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setScoringWeights(SCORING_CONFIG.categories.map(c => ({ ...c })));
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  重置默认
                </button>
                <button
                  onClick={() => setShowScoringSettings(false)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  保存设置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
