/**
 * 中国个人所得税税率表及常量（2024年适用）
 */

// 综合所得年度税率表（适用于年度汇算）
const ANNUAL_TAX_BRACKETS = [
  { min: 0, max: 36000, rate: 0.03, deduction: 0 },
  { min: 36000, max: 144000, rate: 0.10, deduction: 2520 },
  { min: 144000, max: 300000, rate: 0.20, deduction: 16920 },
  { min: 300000, max: 420000, rate: 0.25, deduction: 31920 },
  { min: 420000, max: 660000, rate: 0.30, deduction: 52920 },
  { min: 660000, max: 960000, rate: 0.35, deduction: 85920 },
  { min: 960000, max: Infinity, rate: 0.45, deduction: 181920 },
];

// 累计预扣预缴税率表（按月累计）
const CUMULATIVE_TAX_BRACKETS = ANNUAL_TAX_BRACKETS;

// 年终奖单独计税按月换算税率表
const BONUS_MONTHLY_BRACKETS = [
  { min: 0, max: 3000, rate: 0.03, deduction: 0 },
  { min: 3000, max: 12000, rate: 0.10, deduction: 210 },
  { min: 12000, max: 25000, rate: 0.20, deduction: 1410 },
  { min: 25000, max: 35000, rate: 0.25, deduction: 2660 },
  { min: 35000, max: 55000, rate: 0.30, deduction: 4410 },
  { min: 55000, max: 80000, rate: 0.35, deduction: 7160 },
  { min: 80000, max: Infinity, rate: 0.45, deduction: 15160 },
];

// 劳务报酬预扣税率表
const LABOR_TAX_BRACKETS = [
  { min: 0, max: 20000, rate: 0.20, deduction: 0 },
  { min: 20000, max: 50000, rate: 0.30, deduction: 2000 },
  { min: 50000, max: Infinity, rate: 0.40, deduction: 7000 },
];

// 基本减除费用（免征额）
const MONTHLY_DEDUCTION = 5000;
const ANNUAL_DEDUCTION = 60000;

// 专项附加扣除标准（月额）
const SPECIAL_DEDUCTION_STANDARDS = {
  childEducation: { amount: 2000, label: '子女教育', desc: '每个子女每月2000元' },
  continuingEducation: { amount: 400, label: '继续教育', desc: '学历教育每月400元' },
  continuingEducationCert: { amount: 3600, label: '继续教育(职业资格)', desc: '取得证书当年扣除3600元', isAnnual: true },
  seriousIllness: { amount: 0, label: '大病医疗', desc: '年度累计超15000元部分，限额80000元', isAnnual: true, isVariable: true },
  housingLoan: { amount: 1000, label: '住房贷款利息', desc: '每月1000元，最长240个月' },
  housingRent: { amount: 1500, label: '住房租金', desc: '直辖市/省会/计划单列市每月1500元' },
  housingRentTier2: { amount: 1100, label: '住房租金(二档)', desc: '市辖区户籍人口>100万每月1100元' },
  housingRentTier3: { amount: 800, label: '住房租金(三档)', desc: '市辖区户籍人口≤100万每月800元' },
  elderlySupport: { amount: 3000, label: '赡养老人', desc: '独生子女每月3000元' },
  elderlySupportShared: { amount: 1500, label: '赡养老人(非独生)', desc: '非独生子女每月最高1500元' },
  babycare: { amount: 2000, label: '3岁以下婴幼儿照护', desc: '每个婴幼儿每月2000元' },
};

// 五险一金比例参考（可由用户自定义）
const SOCIAL_INSURANCE_RATES = {
  pension: { personal: 0.08, label: '养老保险' },
  medical: { personal: 0.02, label: '医疗保险' },
  unemployment: { personal: 0.005, label: '失业保险' },
  housingFund: { personal: 0.12, label: '住房公积金' },
};

module.exports = {
  ANNUAL_TAX_BRACKETS,
  CUMULATIVE_TAX_BRACKETS,
  BONUS_MONTHLY_BRACKETS,
  LABOR_TAX_BRACKETS,
  MONTHLY_DEDUCTION,
  ANNUAL_DEDUCTION,
  SPECIAL_DEDUCTION_STANDARDS,
  SOCIAL_INSURANCE_RATES,
};
