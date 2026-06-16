const { calculateAnnualReconciliation, calculateSpecialAdditionalDeductions } = require('../../utils/tax-engine');
const { formatCurrency, formatPercent, formatPercentDecimal } = require('../../utils/formatter');

Page({
  data: {
    annualSalary: '',
    annualLabor: '',
    annualRoyalty: '',
    annualLicense: '',
    annualSocialInsurance: '',
    annualSpecialDeductions: '',
    seriousIllness: '',
    savedInsurance: 0,
    savedDeductions: 0,
    insurancePlaceholder: '全年个人缴纳总额，如 48000',
    deductionsPlaceholder: '全年扣除总额，如 60000',
    result: null,
  },

  onLoad() {
    const insuranceConfig = wx.getStorageSync('insuranceConfig');
    if (insuranceConfig && insuranceConfig.annualTotal > 0) {
      this.setData({
        annualSocialInsurance: String(insuranceConfig.annualTotal.toFixed(2)),
        savedInsurance: insuranceConfig.annualTotal.toFixed(2),
        insurancePlaceholder: `已配置 ${insuranceConfig.annualTotal.toFixed(2)} 元/年`,
      });
    }

    const deductionsConfig = wx.getStorageSync('deductionsConfig');
    if (deductionsConfig) {
      const { annualTotal } = calculateSpecialAdditionalDeductions(deductionsConfig);
      if (annualTotal > 0) {
        this.setData({
          annualSpecialDeductions: String(annualTotal),
          savedDeductions: annualTotal,
          deductionsPlaceholder: `已配置 ${annualTotal} 元/年`,
        });
      }
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  calculate() {
    const annualSalary = parseFloat(this.data.annualSalary) || 0;

    if (annualSalary <= 0) {
      wx.showToast({ title: '请输入年工资收入', icon: 'none' });
      return;
    }

    const result = calculateAnnualReconciliation({
      annualSalary,
      annualLabor: parseFloat(this.data.annualLabor) || 0,
      annualRoyalty: parseFloat(this.data.annualRoyalty) || 0,
      annualLicense: parseFloat(this.data.annualLicense) || 0,
      annualSocialInsurance: parseFloat(this.data.annualSocialInsurance) || 0,
      annualSpecialDeductions: parseFloat(this.data.annualSpecialDeductions) || 0,
      seriousIllnessDeduction: parseFloat(this.data.seriousIllness) || 0,
    });

    this.setData({
      result: {
        ...result,
        annualTaxStr: formatCurrency(result.annualTax),
        totalIncomeStr: formatCurrency(result.totalIncome),
        taxableIncomeStr: formatCurrency(result.taxableIncome),
        rateStr: formatPercent(result.rate),
        deductionStr: formatCurrency(result.deduction),
        effectiveRateStr: formatPercentDecimal(result.effectiveRate),
      },
    });
  },
});
