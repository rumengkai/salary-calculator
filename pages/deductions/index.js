const { calculateSpecialAdditionalDeductions } = require('../../utils/tax-engine');

const CACHE_KEY = 'deductionsPageCache';

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
    const cache = wx.getStorageSync(CACHE_KEY);
    const saved = wx.getStorageSync('deductionsConfig');
    const source = cache || saved;
    if (source) {
      this.restoreFromSource(source);
    }
  },

  restoreFromSource(source) {
    this.setData({
      config: {
        childEducation: !!source.childEducation,
        continuingEducation: !!source.continuingEducation,
        housingLoan: !!source.housingLoan,
        housingRent: !!source.housingRent,
        elderlySupport: !!source.elderlySupport,
        babycare: !!source.babycare,
      },
      childCount: source.childEducation ? (source.childEducation.count || 1) : 1,
      babyCount: source.babycare ? (source.babycare.count || 1) : 1,
      rentTier: source.housingRent ? (source.housingRent.tier || 1) : 1,
      isOnlyChild: source.elderlySupport ? (source.elderlySupport.isOnlyChild !== false) : true,
    });
    this.updateSummary();
  },

  saveCache() {
    wx.setStorageSync(CACHE_KEY, this.buildStorageConfig());
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
    this.saveCache();
  },

  onStepper(e) {
    const key = e.currentTarget.dataset.key;
    const dir = parseInt(e.currentTarget.dataset.dir);
    const current = this.data[key];
    const newVal = Math.max(1, Math.min(10, current + dir));
    this.setData({ [key]: newVal });
    this.updateSummary();
    this.saveCache();
  },

  onRentTier(e) {
    this.setData({ rentTier: parseInt(e.currentTarget.dataset.tier) });
    this.updateSummary();
    this.saveCache();
  },

  onOnlyChild(e) {
    this.setData({ isOnlyChild: e.currentTarget.dataset.val === 'true' });
    this.updateSummary();
    this.saveCache();
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
    wx.removeStorageSync(CACHE_KEY);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 1000);
  },
});
