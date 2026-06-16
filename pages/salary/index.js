const { calculateMonthlySalaryTax, calculateSpecialAdditionalDeductions } = require('../../utils/tax-engine');
const { formatCurrency, formatPercentDecimal } = require('../../utils/formatter');

const CACHE_KEY = 'salaryPageCache';

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
    const cache = wx.getStorageSync(CACHE_KEY);
    if (cache) {
      this.setData({
        monthlySalary: cache.monthlySalary || '',
        socialInsurance: cache.socialInsurance || '',
        specialDeductions: cache.specialDeductions || '',
      });
    }

    this.loadGlobalConfig();
  },

  onShow() {
    this.loadGlobalConfig();
  },

  loadGlobalConfig() {
    // 读取五险一金配置
    const insuranceConfig = wx.getStorageSync('insuranceConfig');
    if (insuranceConfig && insuranceConfig.monthlyTotal > 0) {
      this.setData({
        socialInsurance: String(insuranceConfig.monthlyTotal.toFixed(2)),
        savedInsurance: insuranceConfig.monthlyTotal.toFixed(2),
        insurancePlaceholder: `已配置 ${insuranceConfig.monthlyTotal.toFixed(2)} 元/月`,
      });
    }

    // 读取专项扣除配置
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

  saveCache() {
    wx.setStorageSync(CACHE_KEY, {
      monthlySalary: this.data.monthlySalary,
      socialInsurance: this.data.socialInsurance,
      specialDeductions: this.data.specialDeductions,
    });
  },

  onSalaryInput(e) {
    const salary = e.detail.value;
    const defaultIns = salary ? Math.round(parseFloat(salary) * 0.225) : '';
    this.setData({ monthlySalary: salary, defaultInsurance: defaultIns });
    this.saveCache();
  },

  onInsuranceInput(e) {
    this.setData({ socialInsurance: e.detail.value });
    this.saveCache();
  },

  onDeductionsInput(e) {
    this.setData({ specialDeductions: e.detail.value });
    this.saveCache();
  },

  goToInsurance() {
    wx.navigateTo({ url: '/pages/insurance/index' });
  },

  goToDeductions() {
    wx.navigateTo({ url: '/pages/deductions/index' });
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
