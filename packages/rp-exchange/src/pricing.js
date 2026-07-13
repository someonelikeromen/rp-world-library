function pointName(level) {
  if (!Number.isInteger(level) || level < 1) throw new Error('point level must be positive integer');
  return `${level}级奖励点`;
}

function parseN(value) {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 0 || value > 24) throw new Error(`Invalid N rating: ${value}`);
    return value;
  }
  const m = String(value || '').match(/N\s*(\d{1,2})/i);
  if (!m) throw new Error(`Invalid N rating: ${value}`);
  const n = Number(m[1]);
  if (!Number.isInteger(n) || n < 0 || n > 24) throw new Error(`Invalid N rating: ${value}`);
  return n;
}

function priceForN(nValue, settings) {
  const n = parseN(nValue);
  const row = settings.priceByN[`N${n}`];
  if (!row) throw new Error(`Missing price for N${n}`);
  return {
    n,
    amount: row.amount,
    pointLevel: row.pointLevel,
    display: `${row.amount}个${pointName(row.pointLevel)}`,
  };
}

function normalizeBalances(balances = {}, maxLevel = 5, conversionRate = 1000) {
  const out = {};
  for (let i = 1; i <= maxLevel; i += 1) out[pointName(i)] = Number(balances[pointName(i)] || 0);
  for (let i = 1; i < maxLevel; i += 1) {
    const key = pointName(i);
    const next = pointName(i + 1);
    const carry = Math.floor(out[key] / conversionRate);
    if (carry > 0) {
      out[key] -= carry * conversionRate;
      out[next] += carry;
    }
  }
  return out;
}

function canAfford(balances = {}, price, settings) {
  const conversionRate = settings.currency.conversionRate;
  const maxLevel = Math.max(5, price.pointLevel);
  const normalized = normalizeBalances(balances, maxLevel, conversionRate);
  let totalAtPriceLevel = 0;
  for (let level = price.pointLevel; level <= maxLevel; level += 1) {
    totalAtPriceLevel += normalized[pointName(level)] * (conversionRate ** (level - price.pointLevel));
  }
  return totalAtPriceLevel >= price.amount;
}

function deductPrice(balances = {}, price, settings) {
  if (!canAfford(balances, price, settings)) throw new Error('Insufficient reward points');
  const conversionRate = settings.currency.conversionRate;
  const maxLevel = Math.max(5, price.pointLevel);
  const normalized = normalizeBalances(balances, maxLevel, conversionRate);
  let totalBase = 0;
  for (let level = 1; level <= maxLevel; level += 1) {
    totalBase += normalized[pointName(level)] * (conversionRate ** (level - 1));
  }
  totalBase -= price.amount * (conversionRate ** (price.pointLevel - 1));
  const out = {};
  for (let level = maxLevel; level >= 1; level -= 1) {
    const unit = conversionRate ** (level - 1);
    out[pointName(level)] = Math.floor(totalBase / unit);
    totalBase %= unit;
  }
  return out;
}

module.exports = { pointName, parseN, priceForN, normalizeBalances, canAfford, deductPrice };
