const { calculateSpecialAdditionalDeductions } = require('../../utils/tax-engine');

Page({
  data: {
    config: {
      childEducation: false,
      continuingEducation: false,
      housingLoan: false,
      housingRent: false,
      elderlySupport: false,
      babycare: false,
    },
    childCount: 1,
    babyCount: 1,
    rentTier: 1,
    isOnlyChild: true,
    summary: null,
  },

  onLoad() {
    const saved = wx.getStorageSync('deductionsConfig');
    if (saved) {
      this.setData({
        config: {
          childEducation: !!saved.childEducation,
          continuingEducation: !!saved.continuingEducation,
          housingLoan: !!saved.housingLoan,
          housingRent: !!saved.housingRent,
          elderlySupport: !!saved.elderlySupport,
          babycare: !!saved.babycare,
        },
        childCount: saved.childEducation ? (saved.childEducation.count || 1) : 1,
        babyCount: saved.babycare ? (saved.babycare.count || 1) : 1,
        rentTier: saved.housingRent ? (saved.housingRent.tier || 1) : 1,
        isOnlyChild: saved.elderlySupport ? (saved.elderlySupport.isOnlyChild !== false) : true,
      });
      this.updateSummary();
    }
  },

  onToggle(e) {
    const key = e.currentTarget.dataset.key;
    const value = e.detail.value;

    if (key === 'housingRent' && value && this.data.config.housingLoan) {
      wx.showToast({ title: '租金与贷款不可同时享受', icon: 'none' });
      this.setData({ [`config.housingRent`]: false });
      return;
    }
    if (key === 'housingLoan' && value && this.data.config.housingRent) {
      wx.showToast({ title: '贷款与租金不可同时享受', icon: 'none' });
      this.setData({ [`config.housingLoan`]: false });
      return;
    }

    this.setData({ [`config.${key}`]: value });
    this.updateSummary();
  },

  onStepper(e) {
    const key = e.currentTarget.dataset.key;
    const dir = parseInt(e.currentTarget.dataset.dir);
    const current = this.data[key];
    const newVal = Math.max(1, Math.min(10, current + dir));
    this.setData({ [key]: newVal });
    this.updateSummary();
  },

  onRentTier(e) {
    this.setData({ rentTier: parseInt(e.currentTarget.dataset.tier) });
    this.updateSummary();
  },

  onOnlyChild(e) {
    this.setData({ isOnlyChild: e.currentTarget.dataset.val === 'true' });
    this.updateSummary();
  },

  updateSummary() {
    const storageConfig = this.buildStorageConfig();
    const result = calculateSpecialAdditionalDeductions(storageConfig);
    this.setData({ summary: result });
  },

  buildStorageConfig() {
    const { config, childCount, babyCount, rentTier, isOnlyChild } = this.data;
    const storageConfig = {};

    if (config.childEducation) {
      storageConfig.childEducation = { count: childCount };
    }
    if (config.continuingEducation) {
      storageConfig.continuingEducation = true;
    }
    if (config.housingLoan) {
      storageConfig.housingLoan = true;
    }
    if (config.housingRent) {
      storageConfig.housingRent = { tier: rentTier };
    }
    if (config.elderlySupport) {
      storageConfig.elderlySupport = { isOnlyChild };
    }
    if (config.babycare) {
      storageConfig.babycare = { count: babyCount };
    }

    return storageConfig;
  },

  save() {
    const storageConfig = this.buildStorageConfig();
    wx.setStorageSync('deductionsConfig', storageConfig);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 1000);
  },
});
