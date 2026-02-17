'use client';

import { useState, useEffect } from 'react';
import { Search, Pill, Edit2, Save, X, Download } from 'lucide-react';

interface DrugSpec {
  code: string;
  name: string;
  spec: string;
  dosePerUnit: number | null;
  unit: string;
  perBox?: number;
  defaultDose?: number;
  defaultUnit?: string;
}

export default function DrugDictPage() {
  const [drugs, setDrugs] = useState<DrugSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DrugSpec>>({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drugs/all');
      const data = await res.json();
      if (data.success) {
        setDrugs(data.drugs || []);
        setTotal(data.count || 0);
      }
    } catch (e) {
      console.error('加载失败:', e);
    }
    setLoading(false);
  };

  const startEdit = (drug: DrugSpec) => {
    setEditing(drug.name);
    setEditForm({ ...drug });
  };

  const saveEdit = () => {
    if (!editing) return;
    setDrugs(prev => prev.map(d => 
      d.name === editing ? { ...d, ...editForm } : d
    ));
    setEditing(null);
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  const exportAll = () => {
    const config = drugs.map(d => 
      `  '${d.name.trim()}': { perBox: ${d.perBox || 1}, unit: '${d.unit?.trim() || '粒'}', dosePerUnit: ${d.dosePerUnit || 'null'}, defaultDose: ${d.defaultDose || 'null'}, defaultUnit: '${d.defaultUnit || ''}' },`
    ).join('\n');
    
    console.log('\n========== 配置代码 ==========');
    console.log(config);
    alert(`共 ${drugs.length} 个药品，请查看控制台输出`);
  };

  const filteredDrugs = drugs.filter(d => 
    d.name.toLowerCase().includes(filter.toLowerCase()) ||
    d.spec?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">药品字典</h1>
              <p className="text-gray-500">共 {total} 种药品</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={loadDrugs}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              刷新
            </button>
            <button
              onClick={exportAll}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              导出全部
            </button>
          </div>
        </div>

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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 w-16">序号</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">药品名称</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">规格</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-24">每粒mg</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-24">包装单位</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-24">每盒数量</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-24">默认用量</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-24">用量单位</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-20">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDrugs.map((drug, idx) => (
                  <tr key={idx} className={drug.perBox ? 'bg-green-50' : ''}>
                    <td className="px-4 py-2 text-gray-500 text-sm">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <span className="font-medium text-gray-900">{drug.name}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-600 text-sm">{drug.spec?.trim() || '-'}</td>
                    <td className="px-4 py-2 text-center">
                      {editing === drug.name ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.dosePerUnit || ''}
                          onChange={(e) => setEditForm({...editForm, dosePerUnit: parseFloat(e.target.value) || 0})}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                        />
                      ) : (
                        <span className="text-gray-600">{drug.dosePerUnit || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {editing === drug.name ? (
                        <select
                          value={editForm.unit || ''}
                          onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">选择</option>
                          <option value="丸">丸</option>
                          <option value="片">片</option>
                          <option value="粒">粒</option>
                          <option value="支">支</option>
                          <option value="袋">袋</option>
                          <option value="瓶">瓶</option>
                        </select>
                      ) : (
                        <span className="text-gray-600">{drug.unit?.trim() || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {editing === drug.name ? (
                        <input
                          type="number"
                          value={editForm.perBox || ''}
                          onChange={(e) => setEditForm({...editForm, perBox: parseInt(e.target.value) || 0})}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                        />
                      ) : (
                        <span className="text-gray-900 font-medium">{drug.perBox || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {editing === drug.name ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.defaultDose || ''}
                          onChange={(e) => setEditForm({...editForm, defaultDose: parseFloat(e.target.value) || 0})}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                        />
                      ) : (
                        <span className="text-gray-900">{drug.defaultDose || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {editing === drug.name ? (
                        <select
                          value={editForm.defaultUnit || ''}
                          onChange={(e) => setEditForm({...editForm, defaultUnit: e.target.value})}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">选择</option>
                          <option value="mg">mg</option>
                          <option value="g">g</option>
                          <option value="丸">丸</option>
                          <option value="片">片</option>
                          <option value="粒">粒</option>
                          <option value="支">支</option>
                          <option value="袋">袋</option>
                          <option value="ml">ml</option>
                          <option value="IU">IU</option>
                        </select>
                      ) : (
                        <span className="text-gray-600">{drug.defaultUnit || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {editing === drug.name ? (
                          <>
                            <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => startEdit(drug)} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredDrugs.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              {loading ? '加载中...' : '暂无数据'}
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center text-gray-500">
          显示 {filteredDrugs.length} / {total} 种药品
        </div>
      </div>
    </div>
  );
}
