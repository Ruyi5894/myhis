// 类型定义
export interface Patient {
  zlh: number;
  jbxxbh: number;
  kh: string;
  knxx: string;
  zyh: string;
  xm: string;
  xb: number;
  csny: string;
  sfz: string;
  pzh: string;
  ryrq: string;
  cyrq: string | null;
  ryzd: string;
  ryks: number;
  rybq: number;
  cyfs: number | null;
  djzt: number;
}

export interface VisitRecord {
  ghxh: number;
  zlh: number;
  ghrq: string;
  ksdm: number;
  zgdm: number;
  ghf: number;
  zlf: number;
  jlzt: number;
}

export interface Diagnosis {
  jzlx: number;
  jzmc: string;
}

export interface Department {
  ksdm: number;
  ksmc: string;
}

export interface Assessment {
  id: string;
  patientId: string;
  patientName: string;
  assessDate: string;
  score: number;
  criteria: AssessmentCriteria;
  assessor: string;
  notes: string;
}

export interface AssessmentCriteria {
  completeness: number;
  accuracy: number;
  timeliness: number;
  specification: number;
  examination: number;
}

export interface DashboardStats {
  totalPatients: number;
  totalVisits: number;
  avgAssessmentScore: number;
  completionRate: number;
  monthlyTrends: TrendData[];
  departmentDistribution: DepartmentData[];
  diagnosisDistribution: DiagnosisData[];
}

export interface TrendData {
  month: string;
  patients: number;
  visits: number;
  assessments: number;
}

export interface DepartmentData {
  name: string;
  count: number;
  percentage: number;
}

export interface DiagnosisData {
  name: string;
  count: number;
}
