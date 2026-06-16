const CACHE_KEY = 'insurancePageCache';

Page({
  data: {
    socialBase: '',
    fundBase: '',
    pensionRate: '8',
    medicalRate: '2',
    unemploymentRate: '0.5',
    fundRate: '12',
    pensionAmount: '',
    medicalAmount: '',
    unemploymentAmount: '',
    fundAmount: '',
    totalMonthly: '0.00',
    totalAnnual: '0.00',
  },

  onLoad() {
    const cache = wx.getStorageSync(CACHE_KEY);
    const saved = wx.getStorageSync('insuranceConfig');
    const source = cache || saved;
    if (source) {
      this.setData({
        socialBase: String(source.socialBase || ''),
        fundBase: String(source.fundBase || ''),
        pensionRate: String(source.pensionRate || '8'),
        medicalRate: String(source.medicalRate || '2'),
        unemploymentRate: String(source.unemploymentRate || '0.5'),
        fundRate: String(source.fundRate || '12'),
      });
      this.recalculate();
    }
  },

  saveCache() {
    wx.setStorageSync(CACHE_KEY, {
      socialBase: this.data.socialBase,
      fundBase: this.data.fundBase,
      pensionRate: this.data.pensionRate,
      medicalRate: this.data.medicalRate,
      unemploymentRate: this.data.unemploymentRate,
      fundRate: this.data.fundRate,
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
    this.recalculate();
    this.saveCache();
  },

  onRateInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
    this.recalculate();
    this.saveCache();
  },

  recalculate() {
    const socialBase = parseFloat(this.data.socialBase) || 0;
    const fundBase = parseFloat(this.data.fundBase) || socialBase;
    const pensionRate = parseFloat(this.data.pensionRate) || 0;
    const medicalRate = parseFloat(this.data.medicalRate) || 0;
    const unemploymentRate = parseFloat(this.data.unemploymentRate) || 0;
    const fundRate = parseFloat(this.data.fundRate) || 0;

    const pensionAmount = Math.round(socialBase * pensionRate) / 100;
    const medicalAmount = Math.round(socialBase * medicalRate) / 100;
    const unemploymentAmount = Math.round(socialBase * unemploymentRate * 10) / 1000;
    const fundAmount = Math.round(fundBase * fundRate) / 100;
    const totalMonthly = pensionAmount + medicalAmount + unemploymentAmount + fundAmount;

    this.setData({
      pensionAmount: pensionAmount.toFixed(2),
      medicalAmount: medicalAmount.toFixed(2),
      unemploymentAmount: unemploymentAmount.toFixed(2),
      fundAmount: fundAmount.toFixed(2),
      totalMonthly: totalMonthly.toFixed(2),
      totalAnnual: (totalMonthly * 12).toFixed(2),
    });
  },

  save() {
    const socialBase = parseFloat(this.data.socialBase) || 0;
    if (socialBase <= 0) {
      wx.showToast({ title: '请输入缴费基数', icon: 'none' });
      return;
    }

    const config = {
      socialBase: parseFloat(this.data.socialBase) || 0,
      fundBase: parseFloat(this.data.fundBase) || parseFloat(this.data.socialBase) || 0,
      pensionRate: parseFloat(this.data.pensionRate) || 8,
      medicalRate: parseFloat(this.data.medicalRate) || 2,
      unemploymentRate: parseFloat(this.data.unemploymentRate) || 0.5,
      fundRate: parseFloat(this.data.fundRate) || 12,
      monthlyTotal: parseFloat(this.data.totalMonthly) || 0,
      annualTotal: parseFloat(this.data.totalAnnual) || 0,
    };

    wx.setStorageSync('insuranceConfig', config);
    wx.removeStorageSync(CACHE_KEY);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 1000);
  },
});
