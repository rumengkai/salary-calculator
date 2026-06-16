const { calculateMonthlySalaryTax, calculateSpecialAdditionalDeductions } = require('../../utils/tax-engine');
const { formatCurrency, formatPercentDecimal } = require('../../utils/formatter');

Page({
  data: {
    monthlySalary: '',
    socialInsurance: '',
    specialDeductions: '',
    defaultInsurance: '',
    savedInsurance: 0,
    savedDeductions: 0,
    insurancePlaceholder: '养老+医疗+失业+公积金，如 3375',
    deductionsPlaceholder: '如有多项请填合计，如 5000',
    result: null,
    monthlyAfterTax: '',
    effectiveRate: '',
  },

  onLoad() {
    const insuranceConfig = wx.getStorageSync('insuranceConfig');
    if (insuranceConfig && insuranceConfig.monthlyTotal > 0) {
      this.setData({
        socialInsurance: String(insuranceConfig.monthlyTotal.toFixed(2)),
        savedInsurance: insuranceConfig.monthlyTotal.toFixed(2),
        insurancePlaceholder: `已配置 ${insuranceConfig.monthlyTotal.toFixed(2)} 元/月`,
      });
    }

    const deductionsConfig = wx.getStorageSync('deductionsConfig');
    if (deductionsConfig) {
      const { monthlyTotal } = calculateSpecialAdditionalDeductions(deductionsConfig);
      if (monthlyTotal > 0) {
        this.setData({
          specialDeductions: String(monthlyTotal),
          savedDeductions: monthlyTotal,
          deductionsPlaceholder: `已配置 ${monthlyTotal} 元/月`,
        });
      }
    }
  },

  onSalaryInput(e) {
    const salary = e.detail.value;
    const defaultIns = salary ? Math.round(parseFloat(salary) * 0.225) : '';
    this.setData({
      monthlySalary: salary,
      defaultInsurance: defaultIns,
    });
  },

  onInsuranceInput(e) {
    this.setData({ socialInsurance: e.detail.value });
  },

  onDeductionsInput(e) {
    this.setData({ specialDeductions: e.detail.value });
  },

  calculate() {
    const monthlySalary = parseFloat(this.data.monthlySalary) || 0;
    const socialInsurance = parseFloat(this.data.socialInsurance) || 0;
    const specialDeductions = parseFloat(this.data.specialDeductions) || 0;

    if (monthlySalary <= 0) {
      wx.showToast({ title: '请输入月薪', icon: 'none' });
      return;
    }

    const result = calculateMonthlySalaryTax({
      monthlySalary,
      socialInsurance,
      specialDeductions,
    });

    const formattedResults = result.monthlyResults.map(item => ({
      ...item,
      monthlyTaxStr: formatCurrency(item.monthlyTax),
      cumulativeTaxStr: formatCurrency(item.cumulativeTax),
      afterTaxStr: formatCurrency(item.afterTaxIncome),
    }));

    this.setData({
      result: {
        ...result,
        annualTax: formatCurrency(result.annualTax),
        annualAfterTax: formatCurrency(result.annualAfterTax),
        monthlyResults: formattedResults,
      },
      monthlyAfterTax: formatCurrency(result.annualAfterTax / 12),
      effectiveRate: formatPercentDecimal(monthlySalary * 12 > 0 ? (result.annualTax / (monthlySalary * 12)) * 100 : 0),
    });
  },
});
