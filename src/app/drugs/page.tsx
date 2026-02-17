'use client';

import { useState, useEffect } from 'react';
import { Search, Pill, Edit2, Save, X, RefreshCw } from 'lucide-react';

interface DrugSpec {
  name: string;
  spec: string;
  perBox: number | null;
  unit: string;
  analyzed: boolean;
}

export default function DrugSpecManager() {
  const [drugs, setDrugs] = useState<DrugSpec[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ perBox: '', unit: '' });

  // 加载药品列表
  useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drugs/ai');
      const data = await res.json();
      if (data.success) {
        // 初始化药品列表
        const initialDrugs = data.drugs.map((d: any) => ({
          ...d,
          perBox: null,
          unit: '',
          analyzed: false
        }));
        setDrugs(initialDrugs);
      }
    } catch (e) {
      console.error('加载失败:', e);
    }
    setLoading(false);
  };

  // AI分析单个药品
  const analyzeDrug = async (name: string, spec: string) => {
    setAnalyzing(name);
    try {
      const res = await fetch('/api/drugs/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, spec })
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        setDrugs(prev => prev.map(d => 
          d.name === name 
            ? { ...d, perBox: data.data.perBox, unit: data.data.unit, analyzed: true }
            : d
        ));
      }
    } catch (e) {
      console.error('分析失败:', e);
    }
    setAnalyzing(null);
  };

  // 批量AI分析
  const analyzeAll = async () => {
    setLoading(true);
    for (const drug of drugs) {
      if (!drug.analyzed) {
        await analyzeDrug(drug.name, drug.spec);
        await new Promise(r => setTimeout(r, 500)); // 避免请求过快
      }
    }
    setLoading(false);
  };

  // 开始编辑
  const startEdit = (drug: DrugSpec) => {
    setEditing(drug.name);
    setEditForm({
      perBox: drug.perBox?.toString() || '',
      unit: drug.unit || ''
    });
  };

  // 保存编辑
  const saveEdit = (name: string) => {
    setDrugs(prev => prev.map(d => 
      d.name === name 
        ? { 
            ...d, 
            perBox: parseInt(editForm.perBox) || null, 
            unit: editForm.unit,
            analyzed: true 
          }
        : d
    ));
    setEditing(null);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditing(null);
  };

  // 导出配置
  const exportConfig = () => {
    const analyzed = drugs.filter(d => d.analyzed && d.perBox);
    const config = analyzed.map(d => 
      `  '${d.name}': { perBox: ${d.perBox}, unit: '${d.unit}' },`
    ).join('\n');
    
    console.log('\n========== 配置代码 ==========');
    console.log(config);
    alert(`已分析 ${analyzed.length} 个药品，请查看控制台输出`);
  };

  // 过滤药品
  const filteredDrugs = drugs.filter(d => 
    d.name.toLowerCase().includes(filter.toLowerCase()) ||
    d.spec.toLowerCase().includes(filter.toLowerCase())
  );

  // 统计
  const analyzedCount = drugs.filter(d => d.analyzed).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">药品规格管理</h1>
              <p className="text-gray-500">AI分析药品规格，计算可用天数</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              已分析: <span className="font-bold text-green-600">{analyzedCount}</span> / {drugs.length}
            </div>
            <button
              onClick={analyzeAll}
              disabled={loading || analyzedCount === drugs.length}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              批量AI分析
            </button>
            <button
              onClick={exportConfig}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save className="w-4 h-4" />
              导出配置
            </button>
          </div>
        </div>

        {/* 搜索 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索药品名称或规格..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 药品列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">药品名称</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">规格</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">每盒数量</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">单位</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDrugs.map((drug, idx) => (
                <tr key={idx} className={drug.analyzed ? 'bg-green-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {drug.analyzed && (
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                      <span className="font-medium text-gray-900">{drug.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{drug.spec}</td>
                  <td className="px-4 py-3 text-center">
                    {editing === drug.name ? (
                      <input
                        type="number"
                        value={editForm.perBox}
                        onChange={(e) => setEditForm({...editForm, perBox: e.target.value})}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    ) : (
                      <span className={drug.perBox ? 'text-gray-900' : 'text-gray-400'}>
                        {drug.perBox || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editing === drug.name ? (
                      <select
                        value={editForm.unit}
                        onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                        className="px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="">选择单位</option>
                        <option value="丸">丸</option>
                        <option value="片">片</option>
                        <option value="粒">粒</option>
                        <option value="支">支</option>
                        <option value="袋">袋</option>
                        <option value="ml">ml</option>
                      </select>
                    ) : (
                      <span className={drug.unit ? 'text-gray-900' : 'text-gray-400'}>
                        {drug.unit || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {editing === drug.name ? (
                        <>
                          <button
                            onClick={() => saveEdit(drug.name)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => analyzeDrug(drug.name, drug.spec)}
                            disabled={analyzing === drug.name}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50"
                          >
                            {analyzing === drug.name ? '分析中...' : 'AI分析'}
                          </button>
                          <button
                            onClick={() => startEdit(drug)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredDrugs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {loading ? '加载中...' : '暂无数据'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
