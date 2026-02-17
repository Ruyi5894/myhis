import { NextResponse } from 'next/server';
import sql from 'mssql';

const dbConfig = {
  server: process.env.DB_SERVER || '192.168.1.248',
  database: process.env.DB_NAME || 'HIS3',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'P@ssw0rd',
  port: parseInt(process.env.DB_PORT || '1433'),
  options: { encrypt: false, trustServerCertificate: true },
};

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://192.168.1.243:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3-vl:8b';

let pool: sql.ConnectionPool | null = null;

async function getPool() {
  if (!pool) pool = await sql.connect(dbConfig);
  return pool;
}

// AI分析单个药品规格
async function analyzeDrugSpec(name: string, spec: string): Promise<any> {
  const prompt = `分析以下药品规格，返回JSON格式：
药品名称：${name}
规格：${spec}

分析规格中每盒/瓶含有多少单位（丸、片、粒、支、袋等）。
返回格式：
{
  "perBox": 数字,
  "unit": "单位",
  "note": "简要说明"
}
只返回JSON。`;

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false
      })
    });

    if (!response.ok) return null;
    
    const result = await response.json();
    const jsonMatch = result.response?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('AI分析失败:', e);
  }
  return null;
}

// GET: 获取待分析的药品列表
export async function GET() {
  try {
    const poolConn = await getPool();
    
    // 获取有规格的药品，按名称去重
    const result = await poolConn.request()
      .query(`
        SELECT TOP 200 Mxxmmc, Mzgg 
        FROM JB_SFXMMXK 
        WHERE Mzgg IS NOT NULL AND LEN(Mzgg) > 3
        AND (Mzgg LIKE '%丸%' OR Mzgg LIKE '%片%' OR Mzgg LIKE '%粒%' 
            OR Mzgg LIKE '%支%' OR Mzgg LIKE '%袋%')
        GROUP BY Mxxmmc, Mzgg
      `);

    // 简单解析规格
    const drugs = result.recordset.map((r: any) => {
      const spec = (r.Mzgg || '').trim();
      let perBox = 0;
      let unit = '';
      
      // 解析规格
      const match = spec.match(/(\d+)\s*[×*]\s*(\d+)\s*(片|丸|粒|支|袋|颗)/);
      if (match) {
        perBox = parseInt(match[1]) * parseInt(match[2]);
        unit = match[3];
      } else {
        const simpleMatch = spec.match(/(\d+)\s*(片|丸|粒|支|袋|颗)/);
        if (simpleMatch) {
          perBox = parseInt(simpleMatch[1]);
          unit = simpleMatch[2];
        }
      }
      
      return {
        name: (r.Mxxmmc || '').trim(),
        spec,
        perBox,
        unit
      };
    }).filter((d: any) => d.name && d.perBox > 0);

    // 去重
    const unique = new Map();
    for (const drug of drugs) {
      if (!unique.has(drug.name)) {
        unique.set(drug.name, drug);
      }
    }

    return NextResponse.json({
      success: true,
      count: unique.size,
      drugs: Array.from(unique.values())
    });

  } catch (error) {
    console.error('获取药品列表失败:', error);
    return NextResponse.json({ success: false, error: String(error) });
  }
}

// POST: 批量AI分析药品
export async function POST(request: Request) {
  try {
    const { drugs, startIndex = 0, batchSize = 5 } = await request.json();
    
    const results: any[] = [];
    const endIndex = Math.min(startIndex + batchSize, drugs.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const drug = drugs[i];
      const aiResult = await analyzeDrugSpec(drug.name, drug.spec);
      
      results.push({
        name: drug.name,
        spec: drug.spec,
        ai: aiResult,
        index: i
      });
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({
      success: true,
      results,
      processed: endIndex,
      total: drugs.length,
      hasMore: endIndex < drugs.length
    });

  } catch (error) {
    console.error('批量分析失败:', error);
    return NextResponse.json({ success: false, error: String(error) });
  }
}
