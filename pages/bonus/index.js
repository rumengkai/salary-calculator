const { compareBonusMethods, calculateSpecialAdditionalDeductions } = require('../../utils/tax-engine');
const { formatCurrency, formatPercent } = require('../../utils/formatter');

Page({
  data: {
    bonus: '',
    annualSalary: '',
    annualSocialInsurance: '',
    annualSpecialDeductions: '',
    savedInsurance: 0,
    savedDeductions: 0,
    insurancePlaceholder: '全年个人缴纳合计，如 48000',
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
    const bonus = parseFloat(this.data.bonus) || 0;

    if (bonus <= 0) {
      wx.showToast({ title: '请输入年终奖金额', icon: 'none' });
      return;
    }

    const result = compareBonusMethods({
      bonus,
      annualSalary: parseFloat(this.data.annualSalary) || 0,
      annualSocialInsurance: parseFloat(this.data.annualSocialInsurance) || 0,
      annualSpecialDeductions: parseFloat(this.data.annualSpecialDeductions) || 0,
    });

    this.setData({
      result: {
        ...result,
        savingsStr: formatCurrency(result.savings),
        recommendationText: result.recommendation === 'separate' ? '单独计税' : '并入综合所得',
        separate: {
          ...result.separate,
          monthlyAvgStr: formatCurrency(result.separate.monthlyAvg),
          rateStr: formatPercent(result.separate.rate),
          taxStr: formatCurrency(result.separate.tax),
          afterTaxStr: formatCurrency(result.separate.afterTax),
          totalTaxStr: formatCurrency(result.separate.totalTaxWithSalary),
        },
        combined: {
          ...result.combined,
          bonusTaxStr: formatCurrency(result.combined.bonusTax),
          afterTaxBonusStr: formatCurrency(result.combined.afterTaxBonus),
          totalTaxStr: formatCurrency(result.combined.totalTaxWithSalary),
        },
      },
    });
  },
});
