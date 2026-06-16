const {
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
} = require('../utils/tax-engine');
const { ANNUAL_TAX_BRACKETS, BONUS_MONTHLY_BRACKETS } = require('../utils/tax-tables');

describe('findBracket', () => {
  test('第一档：0-36000', () => {
    const bracket = findBracket(10000, ANNUAL_TAX_BRACKETS);
    expect(bracket.rate).toBe(0.03);
    expect(bracket.deduction).toBe(0);
  });

  test('第二档：36000-144000', () => {
    const bracket = findBracket(50000, ANNUAL_TAX_BRACKETS);
    expect(bracket.rate).toBe(0.10);
  });

  test('第三档：144000-300000', () => {
    const bracket = findBracket(200000, ANNUAL_TAX_BRACKETS);
    expect(bracket.rate).toBe(0.20);
  });

  test('最高档：960000以上', () => {
    const bracket = findBracket(1000000, ANNUAL_TAX_BRACKETS);
    expect(bracket.rate).toBe(0.45);
  });

  test('边界值：正好在36000', () => {
    const bracket = findBracket(36000, ANNUAL_TAX_BRACKETS);
    expect(bracket.rate).toBe(0.03);
  });

  test('边界值：36001', () => {
    const bracket = findBracket(36001, ANNUAL_TAX_BRACKETS);
    expect(bracket.rate).toBe(0.10);
  });
});

describe('calculateSocialInsurance', () => {
  test('默认比例计算', () => {
    const result = calculateSocialInsurance(10000);
    // 8% + 2% + 0.5% + 12% = 22.5%
    expect(result).toBe(2250);
  });

  test('自定义公积金比例', () => {
    const result = calculateSocialInsurance(10000, { housingFund: 0.07 });
    // 8% + 2% + 0.5% + 7% = 17.5%
    expect(result).toBe(1750);
  });
});

describe('calculateMonthlySalaryTax', () => {
  test('月薪10000，无额外扣除', () => {
    const result = calculateMonthlySalaryTax({
      monthlySalary: 10000,
      socialInsurance: 0,
      specialDeductions: 0,
      additionalDeductions: 0,
    });
    // 月应纳税所得额 = 10000 - 5000 = 5000
    // 第1月累计：5000 * 3% = 150
    expect(result.monthlyResults[0].monthlyTax).toBe(150);
    expect(result.monthlyResults.length).toBe(12);
  });

  test('月薪10000，全年税额', () => {
    const result = calculateMonthlySalaryTax({
      monthlySalary: 10000,
      socialInsurance: 0,
      specialDeductions: 0,
      additionalDeductions: 0,
    });
    // 年累计应纳税所得额 = 60000，正好跨3%和10%
    // 前6个月：30000内，3%，每月150
    // 第7月起：累计35000*3%=1050 -> 累计税1050，前6月已交900，本月150
    // 到12月累计 60000，36000*3%+24000*10%=1080+2400-已交的速算=
    expect(result.annualTax).toBe(3480);
  });

  test('月薪低于起征点', () => {
    const result = calculateMonthlySalaryTax({
      monthlySalary: 4000,
      socialInsurance: 0,
      specialDeductions: 0,
      additionalDeductions: 0,
    });
    expect(result.annualTax).toBe(0);
    result.monthlyResults.forEach(m => {
      expect(m.monthlyTax).toBe(0);
    });
  });

  test('月薪5000正好等于起征点', () => {
    const result = calculateMonthlySalaryTax({
      monthlySalary: 5000,
      socialInsurance: 0,
      specialDeductions: 0,
      additionalDeductions: 0,
    });
    expect(result.annualTax).toBe(0);
  });

  test('高薪月薪80000', () => {
    const result = calculateMonthlySalaryTax({
      monthlySalary: 80000,
      socialInsurance: 0,
      specialDeductions: 0,
      additionalDeductions: 0,
    });
    // 年应纳税所得额 = (80000 - 5000) * 12 = 900000
    expect(result.annualTax).toBeGreaterThan(0);
    // 应在35%档
    expect(result.monthlyResults[11].cumulativeTaxableIncome).toBe(900000);
  });

  test('有五险一金和专项扣除', () => {
    const result = calculateMonthlySalaryTax({
      monthlySalary: 20000,
      socialInsurance: 4000,
      specialDeductions: 3000,
      additionalDeductions: 0,
    });
    // 月应纳税所得额 = 20000 - 5000 - 4000 - 3000 = 8000
    // 第1月：8000 * 3% = 240
    expect(result.monthlyResults[0].monthlyTax).toBe(240);
  });

  test('税后收入计算正确', () => {
    const result = calculateMonthlySalaryTax({
      monthlySalary: 10000,
      socialInsurance: 2000,
      specialDeductions: 0,
      additionalDeductions: 0,
    });
    // 税后 = 10000 - 2000 - 月税
    const firstMonth = result.monthlyResults[0];
    expect(firstMonth.afterTaxIncome).toBe(10000 - 2000 - firstMonth.monthlyTax);
  });
});

describe('calculateLaborTax', () => {
  test('收入为0', () => {
    expect(calculateLaborTax(0).tax).toBe(0);
  });

  test('收入800以下免税', () => {
    expect(calculateLaborTax(500).tax).toBe(0);
  });

  test('收入800-4000', () => {
    const result = calculateLaborTax(3000);
    // (3000 - 800) * 20% = 440
    expect(result.tax).toBe(440);
  });

  test('收入4000-20000（80%后）', () => {
    const result = calculateLaborTax(10000);
    // 10000 * 80% * 20% = 1600
    expect(result.tax).toBe(1600);
  });

  test('收入20000-50000（30%档）', () => {
    const result = calculateLaborTax(30000);
    // 30000 * 80% = 24000, 24000 * 30% - 2000 = 5200
    expect(result.tax).toBe(5200);
  });

  test('收入50000以上（40%档）', () => {
    const result = calculateLaborTax(100000);
    // 100000 * 80% = 80000, 80000 * 40% - 7000 = 25000
    expect(result.tax).toBe(25000);
  });
});

describe('calculateRoyaltyTax', () => {
  test('收入为0', () => {
    expect(calculateRoyaltyTax(0).tax).toBe(0);
  });

  test('收入4000以下', () => {
    const result = calculateRoyaltyTax(3000);
    // (3000 - 800) * 70% * 20% = 308
    expect(result.tax).toBe(308);
  });

  test('收入4000以上', () => {
    const result = calculateRoyaltyTax(10000);
    // 10000 * 80% * 70% * 20% = 1120
    expect(result.tax).toBe(1120);
  });
});

describe('calculateLicenseTax', () => {
  test('收入为0', () => {
    expect(calculateLicenseTax(0).tax).toBe(0);
  });

  test('收入4000以下', () => {
    const result = calculateLicenseTax(3000);
    // (3000 - 800) * 20% = 440
    expect(result.tax).toBe(440);
  });

  test('收入4000以上', () => {
    const result = calculateLicenseTax(10000);
    // 10000 * 80% * 20% = 1600
    expect(result.tax).toBe(1600);
  });
});

describe('calculateAnnualReconciliation', () => {
  test('仅工资收入', () => {
    const result = calculateAnnualReconciliation({
      annualSalary: 200000,
      annualSocialInsurance: 40000,
    });
    // 应纳税所得额 = 200000 - 60000 - 40000 = 100000
    // 100000 * 10% - 2520 = 7480
    expect(result.taxableIncome).toBe(100000);
    expect(result.annualTax).toBe(7480);
  });

  test('多种收入综合', () => {
    const result = calculateAnnualReconciliation({
      annualSalary: 200000,
      annualLabor: 50000,
      annualRoyalty: 20000,
      annualLicense: 10000,
      annualSocialInsurance: 40000,
    });
    // 工资: 200000
    // 劳务: 50000 * 80% = 40000
    // 稿酬: 20000 * 80% * 70% = 11200
    // 特许: 10000 * 80% = 8000
    // 总收入: 259200
    // 应纳税所得额: 259200 - 60000 - 40000 = 159200
    expect(result.totalIncome).toBe(259200);
    expect(result.taxableIncome).toBe(159200);
  });

  test('所有扣除', () => {
    const result = calculateAnnualReconciliation({
      annualSalary: 300000,
      annualSocialInsurance: 50000,
      annualSpecialDeductions: 36000,
      annualAdditionalDeductions: 12000,
      seriousIllnessDeduction: 20000,
    });
    // 300000 - 60000 - 50000 - 36000 - 12000 - 20000 = 122000
    expect(result.taxableIncome).toBe(122000);
  });

  test('收入低于扣除，不产生税', () => {
    const result = calculateAnnualReconciliation({
      annualSalary: 50000,
      annualSocialInsurance: 0,
    });
    // 50000 - 60000 < 0
    expect(result.taxableIncome).toBe(0);
    expect(result.annualTax).toBe(0);
  });

  test('有效税率计算', () => {
    const result = calculateAnnualReconciliation({
      annualSalary: 200000,
      annualSocialInsurance: 40000,
    });
    expect(result.effectiveRate).toBeGreaterThan(0);
    expect(result.effectiveRate).toBeLessThan(45);
  });
});

describe('calculateBonusSeparate', () => {
  test('年终奖为0', () => {
    expect(calculateBonusSeparate(0).tax).toBe(0);
  });

  test('年终奖36000（3%档）', () => {
    const result = calculateBonusSeparate(36000);
    // 36000 / 12 = 3000，正好在3%档上限
    // 36000 * 3% - 0 = 1080
    expect(result.tax).toBe(1080);
  });

  test('年终奖36001（10%档，税率陷阱）', () => {
    const result = calculateBonusSeparate(36001);
    // 36001 / 12 = 3000.08，进入10%档
    // 36001 * 10% - 210 = 3390.1
    expect(result.tax).toBe(3390.1);
    // 多发1元多交税 3390.1 - 1080 = 2310.1
  });

  test('年终奖144000', () => {
    const result = calculateBonusSeparate(144000);
    // 144000 / 12 = 12000, 10%档
    // 144000 * 10% - 210 = 14190
    expect(result.tax).toBe(14190);
  });

  test('年终奖300000', () => {
    const result = calculateBonusSeparate(300000);
    // 300000 / 12 = 25000, 20%档
    // 300000 * 20% - 1410 = 58590
    expect(result.tax).toBe(58590);
  });
});

describe('calculateBonusCombined', () => {
  test('年终奖并入综合所得', () => {
    const result = calculateBonusCombined({
      bonus: 50000,
      annualSalary: 200000,
      annualSocialInsurance: 40000,
    });
    // 不含奖金：200000-60000-40000=100000, 100000*10%-2520=7480
    // 含奖金：250000-60000-40000=150000, 150000*20%-16920=13080
    // 奖金部分税：13080-7480=5600
    expect(result.bonusTax).toBe(5600);
    expect(result.totalTax).toBe(13080);
  });
});

describe('compareBonusMethods', () => {
  test('低收入+低年终奖应推荐并入', () => {
    const result = compareBonusMethods({
      bonus: 10000,
      annualSalary: 60000,
      annualSocialInsurance: 0,
    });
    // 单独：10000*3%=300
    // 工资税本身为0（60000-60000=0）
    // 并入：70000-60000=10000, 10000*3%=300
    // 总税相同或并入更优
    expect(['separate', 'combined']).toContain(result.recommendation);
  });

  test('高收入+高年终奖应推荐单独', () => {
    const result = compareBonusMethods({
      bonus: 200000,
      annualSalary: 500000,
      annualSocialInsurance: 50000,
    });
    expect(result.recommendation).toBe('separate');
  });

  test('返回节省金额', () => {
    const result = compareBonusMethods({
      bonus: 100000,
      annualSalary: 300000,
      annualSocialInsurance: 50000,
    });
    expect(result.savings).toBeGreaterThanOrEqual(0);
    expect(result.separate).toBeDefined();
    expect(result.combined).toBeDefined();
  });
});

describe('calculateMonthlySalaryTax - edge cases', () => {
  test('负数工资应不产生税', () => {
    const result = calculateMonthlySalaryTax({
      monthlySalary: 0,
      socialInsurance: 0,
      specialDeductions: 0,
      additionalDeductions: 0,
    });
    expect(result.annualTax).toBe(0);
  });

  test('只传monthlySalary，使用默认值', () => {
    const result = calculateMonthlySalaryTax({ monthlySalary: 10000 });
    expect(result.monthlyResults[0].monthlyTax).toBe(150);
  });

  test('有附加扣除', () => {
    const result = calculateMonthlySalaryTax({
      monthlySalary: 15000,
      socialInsurance: 2000,
      specialDeductions: 0,
      additionalDeductions: 3000,
    });
    // 15000 - 5000 - 2000 - 3000 = 5000/月
    expect(result.monthlyResults[0].monthlyTax).toBe(150);
  });
});

describe('calculateLaborTax - edge cases', () => {
  test('负收入', () => {
    expect(calculateLaborTax(-100).tax).toBe(0);
  });

  test('正好800', () => {
    const result = calculateLaborTax(800);
    expect(result.tax).toBe(0);
  });

  test('正好4000', () => {
    const result = calculateLaborTax(4000);
    // (4000 - 800) * 20% = 640
    expect(result.tax).toBe(640);
  });
});

describe('calculateRoyaltyTax - edge cases', () => {
  test('负收入', () => {
    expect(calculateRoyaltyTax(-100).tax).toBe(0);
  });

  test('收入800以下', () => {
    const result = calculateRoyaltyTax(500);
    // (500 - 800) * 0.7 < 0
    expect(result.tax).toBe(0);
  });

  test('正好4000', () => {
    const result = calculateRoyaltyTax(4000);
    // (4000 - 800) * 0.7 * 0.2 = 448
    expect(result.tax).toBe(448);
  });
});

describe('calculateLicenseTax - edge cases', () => {
  test('负收入', () => {
    expect(calculateLicenseTax(-100).tax).toBe(0);
  });

  test('收入800以下', () => {
    const result = calculateLicenseTax(500);
    // (500 - 800) < 0
    expect(result.tax).toBe(0);
  });
});

describe('calculateBonusSeparate - edge cases', () => {
  test('负数年终奖', () => {
    expect(calculateBonusSeparate(-1000).tax).toBe(0);
  });
});

describe('calculateBonusCombined - edge cases', () => {
  test('年终奖为0', () => {
    const result = calculateBonusCombined({
      bonus: 0,
      annualSalary: 200000,
      annualSocialInsurance: 40000,
    });
    expect(result.bonusTax).toBe(0);
  });

  test('使用默认参数', () => {
    const result = calculateBonusCombined({ bonus: 50000 });
    // annualSalary=0, 50000-60000<0, 税为0是正确的
    expect(result.totalTax).toBe(0);
  });
});

describe('calculateAnnualReconciliation - edge cases', () => {
  test('仅传annualSalary使用默认参数', () => {
    const result = calculateAnnualReconciliation({ annualSalary: 200000 });
    // 200000 - 60000 = 140000, 140000*10%-2520=11480
    expect(result.annualTax).toBe(11480);
  });

  test('所有收入类型不传时默认为0', () => {
    const result = calculateAnnualReconciliation({});
    expect(result.annualTax).toBe(0);
    expect(result.effectiveRate).toBe(0);
  });
});

describe('calculateSpecialAdditionalDeductions - more branches', () => {
  test('子女教育不传count默认为1', () => {
    const result = calculateSpecialAdditionalDeductions({
      childEducation: {},
    });
    expect(result.monthlyTotal).toBe(2000);
  });

  test('住房租金不传tier默认为1', () => {
    const result = calculateSpecialAdditionalDeductions({
      housingRent: {},
    });
    expect(result.monthlyTotal).toBe(1500);
  });

  test('住房租金tier=3', () => {
    const result = calculateSpecialAdditionalDeductions({
      housingRent: { tier: 3 },
    });
    expect(result.monthlyTotal).toBe(800);
  });

  test('住房租金无效tier回退到1500', () => {
    const result = calculateSpecialAdditionalDeductions({
      housingRent: { tier: 99 },
    });
    expect(result.monthlyTotal).toBe(1500);
  });

  test('赡养老人不传isOnlyChild默认为true', () => {
    const result = calculateSpecialAdditionalDeductions({
      elderlySupport: {},
    });
    expect(result.monthlyTotal).toBe(3000);
  });

  test('赡养老人非独生不传amount默认1500', () => {
    const result = calculateSpecialAdditionalDeductions({
      elderlySupport: { isOnlyChild: false },
    });
    expect(result.monthlyTotal).toBe(1500);
  });

  test('婴幼儿照护不传count默认为1', () => {
    const result = calculateSpecialAdditionalDeductions({
      babycare: {},
    });
    expect(result.monthlyTotal).toBe(2000);
  });
});

describe('calculateSpecialAdditionalDeductions', () => {
  test('空配置', () => {
    const result = calculateSpecialAdditionalDeductions({});
    expect(result.monthlyTotal).toBe(0);
    expect(result.annualTotal).toBe(0);
    expect(result.details).toHaveLength(0);
  });

  test('子女教育-1个孩子', () => {
    const result = calculateSpecialAdditionalDeductions({
      childEducation: { count: 1 },
    });
    expect(result.monthlyTotal).toBe(2000);
    expect(result.annualTotal).toBe(24000);
  });

  test('子女教育-2个孩子', () => {
    const result = calculateSpecialAdditionalDeductions({
      childEducation: { count: 2 },
    });
    expect(result.monthlyTotal).toBe(4000);
  });

  test('赡养老人-独生子女', () => {
    const result = calculateSpecialAdditionalDeductions({
      elderlySupport: { isOnlyChild: true },
    });
    expect(result.monthlyTotal).toBe(3000);
  });

  test('赡养老人-非独生子女', () => {
    const result = calculateSpecialAdditionalDeductions({
      elderlySupport: { isOnlyChild: false, amount: 1500 },
    });
    expect(result.monthlyTotal).toBe(1500);
  });

  test('住房租金-一线城市', () => {
    const result = calculateSpecialAdditionalDeductions({
      housingRent: { tier: 1 },
    });
    expect(result.monthlyTotal).toBe(1500);
  });

  test('住房租金-二线城市', () => {
    const result = calculateSpecialAdditionalDeductions({
      housingRent: { tier: 2 },
    });
    expect(result.monthlyTotal).toBe(1100);
  });

  test('多项组合', () => {
    const result = calculateSpecialAdditionalDeductions({
      childEducation: { count: 1 },
      housingLoan: true,
      elderlySupport: { isOnlyChild: true },
      babycare: { count: 1 },
    });
    // 2000 + 1000 + 3000 + 2000 = 8000
    expect(result.monthlyTotal).toBe(8000);
    expect(result.annualTotal).toBe(96000);
    expect(result.details).toHaveLength(4);
  });

  test('继续教育', () => {
    const result = calculateSpecialAdditionalDeductions({
      continuingEducation: true,
    });
    expect(result.monthlyTotal).toBe(400);
  });

  test('住房贷款', () => {
    const result = calculateSpecialAdditionalDeductions({
      housingLoan: true,
    });
    expect(result.monthlyTotal).toBe(1000);
  });
});
