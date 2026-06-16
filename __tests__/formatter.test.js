const { formatCurrency, formatPercent, formatPercentDecimal, parseNumber } = require('../utils/formatter');

describe('formatCurrency', () => {
  test('正常数字', () => {
    expect(formatCurrency(1234.56)).toBe('1,234.56');
  });

  test('大数字', () => {
    expect(formatCurrency(1234567.89)).toBe('1,234,567.89');
  });

  test('0', () => {
    expect(formatCurrency(0)).toBe('0.00');
  });

  test('null/undefined', () => {
    expect(formatCurrency(null)).toBe('0.00');
    expect(formatCurrency(undefined)).toBe('0.00');
  });

  test('整数补齐小数', () => {
    expect(formatCurrency(1000)).toBe('1,000.00');
  });
});

describe('formatPercent', () => {
  test('正常比率', () => {
    expect(formatPercent(0.03)).toBe('3%');
    expect(formatPercent(0.45)).toBe('45%');
  });

  test('null', () => {
    expect(formatPercent(null)).toBe('0%');
  });
});

describe('formatPercentDecimal', () => {
  test('正常', () => {
    expect(formatPercentDecimal(3.74)).toBe('3.74%');
  });

  test('null', () => {
    expect(formatPercentDecimal(null)).toBe('0.00%');
  });
});

describe('parseNumber', () => {
  test('正常字符串', () => {
    expect(parseNumber('12345')).toBe(12345);
  });

  test('带逗号', () => {
    expect(parseNumber('1,234,567')).toBe(1234567);
  });

  test('空值', () => {
    expect(parseNumber('')).toBe(0);
    expect(parseNumber(null)).toBe(0);
    expect(parseNumber(undefined)).toBe(0);
  });

  test('非数字字符串', () => {
    expect(parseNumber('abc')).toBe(0);
  });

  test('小数', () => {
    expect(parseNumber('123.45')).toBe(123.45);
  });
});
