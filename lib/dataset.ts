/**
 * MonitorX Financial Loan & Borrower Synthetic Benchmark Dataset (20,000 Records)
 * Derived statistically for demonstration and risk-modeling algorithms.
 * Note: Synthetic Demonstration Data — Not Real Customer Data.
 */

export type DatasetRecord = {
  id: string; // e.g. MON10001 or CUST-00001
  alt_id?: string;
  name: string;
  phone: string;
  district: string;
  state: string;
  age: number;
  gender: string;
  marital_status: string;
  education_level: string;
  annual_income: number;
  monthly_income: number;
  employment_status: string;
  debt_to_income_ratio: number;
  credit_score: number;
  loan_amount: number;
  risk_category: 'Low' | 'Moderate' | 'High';
  status: 'Approved' | 'Review' | 'Ineligible';
};

export type DatasetStats = {
  totalCount: number;
  avgIncome: number;
  avgCreditScore: number;
  avgLoanAmount: number;
  approvedCount: number;
  reviewCount: number;
  ineligibleCount: number;
  lowRiskCount: number;
  modRiskCount: number;
  highRiskCount: number;
};

const TN_DISTRICTS = [
  'Thanjavur', 'Coimbatore', 'Salem', 'Madurai', 'Tiruchirappalli',
  'Erode', 'Tirunelveli', 'Dindigul', 'Vellore', 'Cuddalore',
  'Viluppuram', 'Tiruppur', 'Kanchipuram', 'Karur', 'Namakkal'
];

const FIRST_NAMES = [
  'Murugan', 'Annamalai', 'Kavitha', 'Selvam', 'Dharmaraj',
  'Ramanathan', 'Senthil', 'Meenakshi', 'Palanisamy', 'Lakshmi',
  'Karuppasamy', 'Muthu', 'Venkatesh', 'Karthik', 'Subramanian',
  'Rajeshwari', 'Sundaram', 'Thangavel', 'Marimuthu', 'Gomathi'
];

const LAST_INITIALS = ['K', 'S', 'R', 'P', 'V', 'M', 'T', 'A', 'N', 'C', 'B', 'G'];

// Seed base patterns
const BASE_PATTERNS = [
  { age: 25, gender: 'Female', marital: 'Married', edu: "Master's", income: 484800, emp: 'Employed', dti: 0.42, score: 781, loan: 450000 },
  { age: 58, gender: 'Female', marital: 'Married', edu: "Bachelor's", income: 268800, emp: 'Employed', dti: 0.19, score: 705, loan: 260000 },
  { age: 53, gender: 'Male', marital: 'Widowed', edu: "Bachelor's", income: 297600, emp: 'Farmer', dti: 0.28, score: 617, loan: 350000 },
  { age: 42, gender: 'Male', marital: 'Single', edu: 'High School', income: 189600, emp: 'Farmer', dti: 0.35, score: 760, loan: 295000 },
  { age: 42, gender: 'Male', marital: 'Single', edu: "Bachelor's", income: 510000, emp: 'Self-employed', dti: 0.35, score: 689, loan: 750000 },
  { age: 63, gender: 'Male', marital: 'Married', edu: "Bachelor's", income: 340800, emp: 'Farmer', dti: 0.46, score: 711, loan: 490000 },
  { age: 25, gender: 'Male', marital: 'Single', edu: "Bachelor's", income: 639600, emp: 'Self-employed', dti: 0.17, score: 689, loan: 880000 },
  { age: 55, gender: 'Female', marital: 'Married', edu: 'High School', income: 554400, emp: 'Employed', dti: 0.30, score: 510, loan: 410000 },
  { age: 30, gender: 'Male', marital: 'Married', edu: "Master's", income: 987600, emp: 'Employed', dti: 0.20, score: 766, loan: 705000 },
  { age: 25, gender: 'Male', marital: 'Divorced', edu: 'High School', income: 180000, emp: 'Farmer', dti: 0.21, score: 626, loan: 210000 },
  { age: 46, gender: 'Female', marital: 'Married', edu: "Master's", income: 781200, emp: 'Self-employed', dti: 0.19, score: 721, loan: 570000 },
  { age: 68, gender: 'Male', marital: 'Married', edu: 'PhD', income: 456800, emp: 'Retired/Farmer', dti: 0.07, score: 715, loan: 150000 },
  { age: 57, gender: 'Male', marital: 'Divorced', edu: 'High School', income: 290400, emp: 'Self-employed', dti: 0.27, score: 648, loan: 385000 },
  { age: 58, gender: 'Male', marital: 'Single', edu: "Bachelor's", income: 436800, emp: 'Farmer', dti: 0.49, score: 761, loan: 410000 },
  { age: 56, gender: 'Female', marital: 'Married', edu: "Bachelor's", income: 572400, emp: 'Employed', dti: 0.28, score: 847, loan: 635000 },
  { age: 34, gender: 'Male', marital: 'Married', edu: 'High School', income: 220000, emp: 'Farmer', dti: 0.38, score: 680, loan: 300000 },
  { age: 49, gender: 'Female', marital: 'Married', edu: "Bachelor's", income: 380000, emp: 'Farmer', dti: 0.32, score: 740, loan: 450000 },
  { age: 61, gender: 'Male', marital: 'Married', edu: 'High School', income: 310000, emp: 'Farmer', dti: 0.45, score: 655, loan: 320000 },
];

export const TOTAL_DATASET_COUNT = 20000;

// Lazy in-memory cache
let cachedDataset: DatasetRecord[] | null = null;
let cachedStats: DatasetStats | null = null;

export function getFullDataset(): DatasetRecord[] {
  if (cachedDataset) return cachedDataset;

  const records: DatasetRecord[] = [];
  const baseLen = BASE_PATTERNS.length;

  for (let i = 0; i < TOTAL_DATASET_COUNT; i++) {
    const base = BASE_PATTERNS[i % baseLen];
    const cycle = Math.floor(i / baseLen);
    
    // Deterministic realistic variance
    const ageVariance = ((i * 7) % 21) - 10;
    const finalAge = Math.min(75, Math.max(21, base.age + ageVariance));
    
    const incomeVariance = ((i * 1100) % 80000) - 40000;
    const finalIncome = Math.max(120000, base.income + (cycle * 2500) + incomeVariance);
    const monthlyIncome = Math.round(finalIncome / 12);
    
    const scoreOffset = ((i * 13) % 70) - 35;
    const finalScore = Math.min(850, Math.max(300, base.score + scoreOffset));
    
    const dtiOffset = (((i * 9) % 30) - 15) / 100;
    const finalDti = Math.max(0.05, Math.min(0.85, parseFloat((base.dti + dtiOffset).toFixed(2))));
    
    const loanVariance = ((i * 3500) % 150000) - 75000;
    const finalLoan = Math.max(50000, base.loan + loanVariance);

    const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_INITIALS[(i * 3) % LAST_INITIALS.length]}`;
    const district = TN_DISTRICTS[i % TN_DISTRICTS.length];
    const phone = `+91${9840000000 + (i % 900000)}`;
    
    // Support dual identifier schemes: MON10001 and CUST-00001
    const custNum = i + 1;
    const id = `MON${10000 + custNum}`;
    const alt_id = `CUST-${String(custNum).padStart(5, '0')}`;

    let risk: 'Low' | 'Moderate' | 'High' = 'Low';
    let status: 'Approved' | 'Review' | 'Ineligible' = 'Approved';

    if (finalScore < 620 || finalDti > 0.55) {
      risk = 'High';
      status = 'Ineligible';
    } else if (finalScore < 700 || finalDti > 0.40) {
      risk = 'Moderate';
      status = 'Review';
    }

    records.push({
      id,
      alt_id,
      name,
      phone,
      district,
      state: 'Tamil Nadu',
      age: finalAge,
      gender: i % 3 === 0 ? 'Female' : 'Male',
      marital_status: base.marital,
      education_level: base.edu,
      annual_income: finalIncome,
      monthly_income: monthlyIncome,
      employment_status: i % 4 === 0 ? 'Self-employed' : (i % 5 === 0 ? 'Employed' : 'Farmer'),
      debt_to_income_ratio: finalDti,
      credit_score: finalScore,
      loan_amount: finalLoan,
      risk_category: risk,
      status,
    });
  }

  cachedDataset = records;
  return records;
}

export function getDatasetStats(): DatasetStats {
  if (cachedStats) return cachedStats;

  const data = getFullDataset();
  let totalIncome = 0;
  let totalScore = 0;
  let totalLoan = 0;
  let approved = 0;
  let review = 0;
  let ineligible = 0;
  let lowRisk = 0;
  let modRisk = 0;
  let highRisk = 0;

  for (const r of data) {
    totalIncome += r.annual_income;
    totalScore += r.credit_score;
    totalLoan += r.loan_amount;
    if (r.status === 'Approved') approved++;
    else if (r.status === 'Review') review++;
    else ineligible++;

    if (r.risk_category === 'Low') lowRisk++;
    else if (r.risk_category === 'Moderate') modRisk++;
    else highRisk++;
  }

  cachedStats = {
    totalCount: data.length,
    avgIncome: Math.round(totalIncome / data.length),
    avgCreditScore: Math.round(totalScore / data.length),
    avgLoanAmount: Math.round(totalLoan / data.length),
    approvedCount: approved,
    reviewCount: review,
    ineligibleCount: ineligible,
    lowRiskCount: lowRisk,
    modRiskCount: modRisk,
    highRiskCount: highRisk,
  };

  return cachedStats;
}

export type QueryParams = {
  query?: string;
  riskFilter?: 'All' | 'Low' | 'Moderate' | 'High';
  statusFilter?: 'All' | 'Approved' | 'Review' | 'Ineligible';
  districtFilter?: string;
  page?: number;
  pageSize?: number;
};

export function queryDataset(params: QueryParams) {
  const dataset = getFullDataset();
  const {
    query = '',
    riskFilter = 'All',
    statusFilter = 'All',
    districtFilter = 'All',
    page = 1,
    pageSize = 25,
  } = params;

  const q = query.toLowerCase().trim();

  const filtered = dataset.filter((item) => {
    if (riskFilter !== 'All' && item.risk_category !== riskFilter) return false;
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;
    if (districtFilter !== 'All' && item.district !== districtFilter) return false;

    if (q) {
      const matchId = item.id.toLowerCase().includes(q) || (item.alt_id && item.alt_id.toLowerCase().includes(q));
      const matchName = item.name.toLowerCase().includes(q);
      const matchPhone = item.phone.includes(q);
      const matchDistrict = item.district.toLowerCase().includes(q);
      const matchState = item.state.toLowerCase().includes(q);
      const matchEmp = item.employment_status.toLowerCase().includes(q);
      return matchId || matchName || matchPhone || matchDistrict || matchState || matchEmp;
    }

    return true;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  return {
    records: paginated,
    total,
    page: currentPage,
    totalPages,
    pageSize,
  };
}
