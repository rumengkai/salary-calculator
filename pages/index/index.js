const { calculateSpecialAdditionalDeductions } = require('../../utils/tax-engine');

Page({
  data: {
    deductionsSummary: null,
    insuranceSummary: null,
  },

  onShow() {
    const deductionsConfig = wx.getStorageSync('deductionsConfig');
    if (deductionsConfig) {
      const result = calculateSpecialAdditionalDeductions(deductionsConfig);
      this.setData({ deductionsSummary: result });
    } else {
      this.setData({ deductionsSummary: null });
    }

    const insuranceConfig = wx.getStorageSync('insuranceConfig');
    if (insuranceConfig && insuranceConfig.monthlyTotal > 0) {
      this.setData({
        insuranceSummary: {
          monthlyTotal: insuranceConfig.monthlyTotal.toFixed(2),
          annualTotal: insuranceConfig.annualTotal.toFixed(2),
        },
      });
    } else {
      this.setData({ insuranceSummary: null });
    }
  },

  goToSalary() {
    wx.navigateTo({ url: '/pages/salary/index' });
  },

  goToAnnual() {
    wx.navigateTo({ url: '/pages/annual/index' });
  },

  goToBonus() {
    wx.navigateTo({ url: '/pages/bonus/index' });
  },

  goToDeductions() {
    wx.navigateTo({ url: '/pages/deductions/index' });
  },

  goToInsurance() {
    wx.navigateTo({ url: '/pages/insurance/index' });
  },

  goToGuide() {
    wx.navigateTo({ url: '/pages/guide/index' });
  },

  onShareAppMessage() {
    return {
      title: '个税计算器 — 工资/年终奖/汇算一键搞定',
      path: '/pages/index/index',
    };
  },
});
