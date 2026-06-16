const {
  ANNUAL_TAX_BRACKETS,
  CUMULATIVE_TAX_BRACKETS,
  BONUS_MONTHLY_BRACKETS,
  LABOR_TAX_BRACKETS,
  MONTHLY_DEDUCTION,
  ANNUAL_DEDUCTION,
  SOCIAL_INSURANCE_RATES,
} = require('./tax-tables');

/**
 * 根据税率表查找适用税率和速算扣除数
 */
function findBracket(amount, brackets) {
  for (const bracket of brackets) {
    if (amount > bracket.min && amount <= bracket.max) {
      return bracket;
    }
  }
  return brackets[brackets.length - 1];
}

/**
 * 计算五险一金个人缴纳部分
 */
function calculateSocialInsurance(salary, rates = {}) {
  const defaultRates = {
    pension: SOCIAL_INSURANCE_RATES.pension.personal,
    medical: SOCIAL_INSURANCE_RATES.medical.personal,
    unemployment: SOCIAL_INSURANCE_RATES.unemployment.personal,
    housingFund: SOCIAL_INSURANCE_RATES.housingFund.personal,
  };
  const mergedRates = { ...defaultRates, ...rates };
  const total = Object.values(mergedRates).reduce((sum, rate) => sum + salary * rate, 0);
  return Math.round(total * 100) / 100;
}

/**
 * 月度工资累计预扣预缴法
 * 返回12个月每月应缴税额明细
 */
function calculateMonthlySalaryTax({
  monthlySalary,
  socialInsurance = 0,
  specialDeductions = 0,
  additionalDeductions = 0,
}) {
  const monthlyResults = [];
  let cumulativeTaxableIncome = 0;
  let cumulativeTaxPaid = 0;

  for (let month = 1; month <= 12; month++) {
    const cumulativeIncome = monthlySalary * month;
    const cumulativeBasicDeduction = MONTHLY_DEDUCTION * month;
    const cumulativeSocialInsurance = socialInsurance * month;
    const cumulativeSpecialDeductions = specialDeductions * month;
    const cumulativeAdditionalDeductions = additionalDeductions * month;

    cumulativeTaxableIncome = cumulativeIncome
      - cumulativeBasicDeduction
      - cumulativeSocialInsurance
      - cumulativeSpecialDeductions
      - cumulativeAdditionalDeductions;

    if (cumulativeTaxableIncome < 0) {
      cumulativeTaxableIncome = 0;
    }

    const bracket = findBracket(cumulativeTaxableIncome, CUMULATIVE_TAX_BRACKETS);
    const cumulativeTaxDue = cumulativeTaxableIncome * bracket.rate - bracket.deduction;
    const monthlyTax = Math.max(0, Math.round((cumulativeTaxDue - cumulativeTaxPaid) * 100) / 100);

    cumulativeTaxPaid += monthlyTax;

    monthlyResults.push({
      month,
      monthlySalary,
      socialInsurance,
      specialDeductions,
      additionalDeductions,
      cumulativeTaxableIncome: Math.round(cumulativeTaxableIncome * 100) / 100,
      monthlyTax,
      cumulativeTax: Math.round(cumulativeTaxPaid * 100) / 100,
      afterTaxIncome: Math.round((monthlySalary - socialInsurance - monthlyTax) * 100) / 100,
    });
  }

  return {
    monthlyResults,
    annualTax: Math.round(cumulativeTaxPaid * 100) / 100,
    annualAfterTax: Math.round((monthlySalary * 12 - socialInsurance * 12 - cumulativeTaxPaid) * 100) / 100,
  };
}

/**
 * 劳务报酬预扣预缴税额
 */
function calculateLaborTax(income) {
  if (income <= 0) return { tax: 0, afterTax: 0 };

  let taxableIncome;
  if (income <= 4000) {
    taxableIncome = income - 800;
  } else {
    taxableIncome = income * 0.8;
  }

  if (taxableIncome <= 0) return { tax: 0, afterTax: income };

  const bracket = findBracket(taxableIncome, LABOR_TAX_BRACKETS);
  const tax = Math.round((taxableIncome * bracket.rate - bracket.deduction) * 100) / 100;
  return { tax, afterTax: Math.round((income - tax) * 100) / 100 };
}

/**
 * 稿酬所得预扣预缴
 */
function calculateRoyaltyTax(income) {
  if (income <= 0) return { tax: 0, afterTax: 0 };

  let taxableIncome;
  if (income <= 4000) {
    taxableIncome = (income - 800) * 0.7;
  } else {
    taxableIncome = income * 0.8 * 0.7;
  }

  if (taxableIncome <= 0) return { tax: 0, afterTax: income };

  const tax = Math.round(taxableIncome * 0.2 * 100) / 100;
  return { tax, afterTax: Math.round((income - tax) * 100) / 100 };
}

/**
 * 特许权使用费预扣预缴
 */
function calculateLicenseTax(income) {
  if (income <= 0) return { tax: 0, afterTax: 0 };

  let taxableIncome;
  if (income <= 4000) {
    taxableIncome = income - 800;
  } else {
    taxableIncome = income * 0.8;
  }

  if (taxableIncome <= 0) return { tax: 0, afterTax: income };

  const tax = Math.round(taxableIncome * 0.2 * 100) / 100;
  return { tax, afterTax: Math.round((income - tax) * 100) / 100 };
}

/**
 * 年度综合所得汇算
 */
function calculateAnnualReconciliation({
  annualSalary = 0,
  annualLabor = 0,
  annualRoyalty = 0,
  annualLicense = 0,
  annualSocialInsurance = 0,
  annualSpecialDeductions = 0,
  annualAdditionalDeductions = 0,
  seriousIllnessDeduction = 0,
}) {
  // 各类收入换算为应纳税所得额
  const salaryIncome = annualSalary;
  const laborIncome = annualLabor * 0.8; // 劳务报酬按80%计入
  const royaltyIncome = annualRoyalty * 0.8 * 0.7; // 稿酬按56%计入
  const licenseIncome = annualLicense * 0.8; // 特许权按80%计入

  const totalIncome = salaryIncome + laborIncome + royaltyIncome + licenseIncome;

  const taxableIncome = Math.max(0,
    totalIncome
    - ANNUAL_DEDUCTION
    - annualSocialInsurance
    - annualSpecialDeductions
    - annualAdditionalDeductions
    - seriousIllnessDeduction
  );

  const bracket = findBracket(taxableIncome, ANNUAL_TAX_BRACKETS);
  const annualTax = Math.max(0, Math.round((taxableIncome * bracket.rate - bracket.deduction) * 100) / 100);

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    rate: bracket.rate,
    deduction: bracket.deduction,
    annualTax,
    effectiveRate: totalIncome > 0 ? Math.round((annualTax / totalIncome) * 10000) / 100 : 0,
  };
}

/**
 * 年终奖单独计税
 */
function calculateBonusSeparate(bonus) {
  if (bonus <= 0) return { tax: 0, afterTax: 0, rate: 0 };

  const monthlyAvg = bonus / 12;
  const bracket = findBracket(monthlyAvg, BONUS_MONTHLY_BRACKETS);
  const tax = Math.round((bonus * bracket.rate - bracket.deduction) * 100) / 100;

  return {
    tax: Math.max(0, tax),
    afterTax: Math.round((bonus - Math.max(0, tax)) * 100) / 100,
    rate: bracket.rate,
    monthlyAvg: Math.round(monthlyAvg * 100) / 100,
  };
}

/**
 * 年终奖并入综合所得计税
 */
function calculateBonusCombined({
  bonus = 0,
  annualSalary = 0,
  annualSocialInsurance = 0,
  annualSpecialDeductions = 0,
  annualAdditionalDeductions = 0,
}) {
  // 不含年终奖的税额
  const withoutBonus = calculateAnnualReconciliation({
    annualSalary,
    annualSocialInsurance,
    annualSpecialDeductions,
    annualAdditionalDeductions,
  });

  // 含年终奖的税额
  const withBonus = calculateAnnualReconciliation({
    annualSalary: annualSalary + bonus,
    annualSocialInsurance,
    annualSpecialDeductions,
    annualAdditionalDeductions,
  });

  const bonusTax = Math.round((withBonus.annualTax - withoutBonus.annualTax) * 100) / 100;

  return {
    totalTax: withBonus.annualTax,
    bonusTax: Math.max(0, bonusTax),
    afterTaxBonus: Math.round((bonus - Math.max(0, bonusTax)) * 100) / 100,
  };
}

/**
 * 年终奖两种计税方式对比
 */
function compareBonusMethods({
  bonus = 0,
  annualSalary = 0,
  annualSocialInsurance = 0,
  annualSpecialDeductions = 0,
  annualAdditionalDeductions = 0,
}) {
  const separate = calculateBonusSeparate(bonus);
  const combined = calculateBonusCombined({
    bonus,
    annualSalary,
    annualSocialInsurance,
    annualSpecialDeductions,
    annualAdditionalDeductions,
  });

  const separateTotalTax = calculateAnnualReconciliation({
    annualSalary,
    annualSocialInsurance,
    annualSpecialDeductions,
    annualAdditionalDeductions,
  }).annualTax + separate.tax;

  const combinedTotalTax = combined.totalTax;
  const savings = Math.round((Math.max(separateTotalTax, combinedTotalTax) - Math.min(separateTotalTax, combinedTotalTax)) * 100) / 100;

  return {
    separate: { ...separate, totalTaxWithSalary: Math.round(separateTotalTax * 100) / 100 },
    combined: { ...combined, totalTaxWithSalary: Math.round(combinedTotalTax * 100) / 100 },
    recommendation: separateTotalTax <= combinedTotalTax ? 'separate' : 'combined',
    savings,
  };
}

/**
 * 计算专项附加扣除月度总额
 */
function calculateSpecialAdditionalDeductions(config = {}) {
  let monthlyTotal = 0;
  const details = [];

  if (config.childEducation) {
    const count = config.childEducation.count || 1;
    const amount = 2000 * count;
    monthlyTotal += amount;
    details.push({ key: 'childEducation', label: '子女教育', amount, count });
  }

  if (config.continuingEducation) {
    monthlyTotal += 400;
    details.push({ key: 'continuingEducation', label: '继续教育', amount: 400 });
  }

  if (config.housingLoan) {
    monthlyTotal += 1000;
    details.push({ key: 'housingLoan', label: '住房贷款利息', amount: 1000 });
  }

  if (config.housingRent) {
    const tier = config.housingRent.tier || 1;
    const amounts = { 1: 1500, 2: 1100, 3: 800 };
    const amount = amounts[tier] || 1500;
    monthlyTotal += amount;
    details.push({ key: 'housingRent', label: '住房租金', amount, tier });
  }

  if (config.elderlySupport) {
    const isOnly = config.elderlySupport.isOnlyChild !== false;
    const amount = isOnly ? 3000 : (config.elderlySupport.amount || 1500);
    monthlyTotal += amount;
    details.push({ key: 'elderlySupport', label: '赡养老人', amount, isOnlyChild: isOnly });
  }

  if (config.babycare) {
    const count = config.babycare.count || 1;
    const amount = 2000 * count;
    monthlyTotal += amount;
    details.push({ key: 'babycare', label: '3岁以下婴幼儿照护', amount, count });
  }

  return {
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
    details,
  };
}

module.exports = {
  findBracket,
  calculateSocialInsurance,
  calculateMonthlySalaryTax,
  calculateLaborTax,
  calculateRoyaltyTax,
  calculateLicenseTax,
  calculateAnnualReconciliation,
  calculateBonusSeparate,
  calculateBonusCombined,
  compareBonusMethods,
  calculateSpecialAdditionalDeductions,
};
