'use client';

import { useState, useEffect } from 'react';
import { Search, Pill, Edit2, Save, X, RefreshCw, Download } from 'lucide-react';

interface DrugSpec {
  name: string;
  spec: string;
  perBox: number;
  unit: string;
  dosePerUnit?: number;
  defaultDose?: number;
  defaultUnit?: string;
}

export default function DrugSpecManager() {
  const [drugs, setDrugs] = useState<DrugSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DrugSpec>>({});

  useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drugs/ai');
      const data = await res.json();
      if (data.success) {
        setDrugs(data.drugs || []);
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

  const saveEdit = async () => {
    if (!editing || !editForm.name) return;
    
    try {
      await fetch('/api/drugs/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editing, updates: editForm })
      });
      
      setDrugs(prev => prev.map(d => 
        d.name === editing ? { ...d, ...editForm } : d
      ));
    } catch (e) {
      console.error('保存失败:', e);
    }
    setEditing(null);
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  const exportConfig = () => {
    const config = drugs.map(d => 
      `  '${d.name}': { perBox: ${d.perBox}, unit: '${d.unit}', dosePerUnit: ${d.dosePerUnit || 'null'}, defaultDose: ${d.defaultDose || 'null'}, defaultUnit: '${d.defaultUnit || ''}' },`
    ).join('\n');
    
    console.log('\n========== 配置代码 ==========');
    console.log(config);
    alert(`共 ${drugs.length} 个药品配置，请查看控制台输出`);
  };

  const filteredDrugs = drugs.filter(d => 
    d.name.toLowerCase().includes(filter.toLowerCase()) ||
    d.spec.toLowerCase().includes(filter.toLowerCase())
  );

  const analyzedCount = drugs.filter(d => d.perBox > 0).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">药品剂量管理</h1>
              <p className="text-gray-500">药典规格数据库，共 {drugs.length} 种药品</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              已配置: <span className="font-bold text-green-600">{analyzedCount}</span> / {drugs.length}
            </div>
            <button
              onClick={exportConfig}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              导出配置
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">药品名称</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">规格</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">每盒数量</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">单位</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">每粒mg</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">默认用量</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">用量单位</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDrugs.map((drug, idx) => (
                  <tr key={idx} className={drug.perBox > 0 ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {drug.perBox > 0 && (
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                        <span className="font-medium text-gray-900">{drug.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{drug.spec}</td>
                    <td className="px-4 py-3 text-center">
                      {editing === drug.name ? (
                        <input
                          type="number"
                          value={editForm.perBox || ''}
                          onChange={(e) => setEditForm({...editForm, perBox: parseInt(e.target.value) || 0})}
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
                          value={editForm.unit || ''}
                          onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                          className="px-2 py-1 border border-gray-300 rounded"
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
                        <span className={drug.unit ? 'text-gray-900' : 'text-gray-400'}>
                          {drug.unit || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editing === drug.name ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.dosePerUnit || ''}
                          onChange={(e) => setEditForm({...editForm, dosePerUnit: parseFloat(e.target.value) || 0})}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      ) : (
                        <span className="text-gray-600">{drug.dosePerUnit || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editing === drug.name ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.defaultDose || ''}
                          onChange={(e) => setEditForm({...editForm, defaultDose: parseFloat(e.target.value) || 0})}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      ) : (
                        <span className="text-gray-900 font-medium">{drug.defaultDose || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editing === drug.name ? (
                        <select
                          value={editForm.defaultUnit || ''}
                          onChange={(e) => setEditForm({...editForm, defaultUnit: e.target.value})}
                          className="px-2 py-1 border border-gray-300 rounded"
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
                          <option value="μg">μg</option>
                        </select>
                      ) : (
                        <span className="text-gray-600">{drug.defaultUnit || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {editing === drug.name ? (
                          <>
                            <button
                              onClick={saveEdit}
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
                          <button
                            onClick={() => startEdit(drug)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
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
