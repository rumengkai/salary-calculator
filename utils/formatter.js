/**
 * 数字格式化工具
 */

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '0.00';
  return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatPercent(rate) {
  if (rate === null || rate === undefined) return '0%';
  return (rate * 100).toFixed(0) + '%';
}

function formatPercentDecimal(rate) {
  if (rate === null || rate === undefined) return '0.00%';
  return rate.toFixed(2) + '%';
}

function parseNumber(str) {
  if (!str) return 0;
  const num = parseFloat(String(str).replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}

module.exports = {
  formatCurrency,
  formatPercent,
  formatPercentDecimal,
  parseNumber,
};
