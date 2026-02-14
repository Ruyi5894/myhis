import { NextResponse } from 'next/server';
import sql from 'mssql';

const dbConfig = {
  server: '192.168.1.243',
  database: 'myhis',
  user: 'sa',
  password: 'RfVbGtUjM,Ki',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool: sql.ConnectionPool | null = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

// 获取患者详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const pool = await getPool();
    
    // 住院详情
    if (id.startsWith('ZY') || !isNaN(Number(id))) {
      const zyQuery = `
        SELECT TOP 1 
          zlh, jbxxbh, kh, knxx, zyh, xm, xb, csny, sfz, pzh,
          ztqkdm, zhbz, jzlx, tsrybz, brlx,
          ryrq, ryfs, ryzd, ryks, rybq, ryqk,
          cyrq, cyfs, klb, czy, djzt, Dqbz, Zycs, YBJFLX, XZQ, sbryzd, Cxrq,
          '住院' AS jzlx_text,
          CASE WHEN cyrq IS NULL THEN '在院' ELSE '已出院' END AS status,
          DATEDIFF(DAY, ryrq, ISNULL(cyrq, GETDATE())) AS days
        FROM ZY_BRZLXXK
        WHERE zlh = ${id} OR zyh = '${id}'
      `;
      
      const zyResult = await pool.request().query(zyQuery);
      
      if (zyResult.recordset.length > 0) {
        const patient = zyResult.recordset[0];
        
        // 获取费用明细
        const fyQuery = `
          SELECT TOP 20 
            Fph, Jsxh, Jssj, Zje, Xjzje, Jzje, Flzfje
          FROM ZY_FPXXK
          WHERE zlh = ${id}
          ORDER BY Jssj DESC
        `;
        const fyResult = await pool.request().query(fyQuery);
        
        return NextResponse.json({
          success: true,
          data: {
            type: 'inpatient',
            basic: patient,
            fees: fyResult.recordset,
          },
        });
      }
    }
    
    // 门诊详情
    const mzQuery = `
      SELECT TOP 1 
        g.zlh, g.Ghxh, g.Ghlx, g.Fymc, g.Ghrq, g.Ksdm, g.Zgdm, 
        g.Ghf, g.Jzghf, g.Zlf, g.Jzzlf, g.Qtf, g.Czy, g.Jlzt,
        '门诊' AS jzlx_text,
        '已完成' AS status
      FROM GH_MXXXK g
      WHERE g.zlh = ${id}
    `;
    
    const mzResult = await pool.request().query(mzQuery);
    
    if (mzResult.recordset.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          type: 'outpatient',
          basic: mzResult.recordset[0],
          fees: [],
        },
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '未找到该患者记录',
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: '数据库连接失败: ' + String(error) },
      { status: 500 }
    );
  }
}
