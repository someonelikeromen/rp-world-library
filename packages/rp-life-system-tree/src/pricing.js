function pointName(level) {
  if (!Number.isInteger(level) || level < 1) throw new Error('point level must be positive integer');
  return `${level}级奖励点`;
}

function parseN(value) {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 0 || value > 24) throw new Error(`Invalid N rating: ${value}`);
    return value;
  }
  if (value && typeof value === 'object') return parseN(value.n ?? value.rating ?? value.overall ?? value.pricingRating);
  const m = String(value || '').match(/N\s*(\d{1,2})/i);
  if (!m) throw new Error(`Invalid N rating: ${value}`);
  const n = Number(m[1]);
  if (!Number.isInteger(n) || n < 0 || n > 24) throw new Error(`Invalid N rating: ${value}`);
  return n;
}

function priceForN(nValue, exchangeSettings) {
  const n = parseN(nValue);
  const row = exchangeSettings.priceByN[`N${n}`];
  if (!row) throw new Error(`Missing price for N${n}`);
  return { n, amount: row.amount, pointLevel: row.pointLevel, display: `${row.amount}个${pointName(row.pointLevel)}` };
}

function toBaseUnits(price, conversionRate = 1000) {
  return price.amount * (conversionRate ** (price.pointLevel - 1));
}

function fromBaseUnits(totalBase, conversionRate = 1000, maxLevel = 5) {
  const out = {};
  let rest = Math.max(0, Math.floor(totalBase));
  for (let level = maxLevel; level >= 1; level -= 1) {
    const unit = conversionRate ** (level - 1);
    const amount = Math.floor(rest / unit);
    if (amount > 0 || level <= 3) out[pointName(level)] = amount;
    rest %= unit;
  }
  return out;
}

function compactBasePrice(totalBase, conversionRate = 1000, maxLevel = 5) {
  let bestLevel = 1;
  for (let level = maxLevel; level >= 1; level -= 1) {
    const unit = conversionRate ** (level - 1);
    if (totalBase >= unit && totalBase % unit === 0) { bestLevel = level; break; }
  }
  const amount = Math.floor(totalBase / (conversionRate ** (bestLevel - 1)));
  return { amount, pointLevel: bestLevel, display: `${amount}个${pointName(bestLevel)}`, baseUnits: totalBase };
}

function upgradeDeltaPrice(fromRating, toRating, exchangeSettings) {
  const from = priceForN(fromRating, exchangeSettings);
  const to = priceForN(toRating, exchangeSettings);
  const conversionRate = exchangeSettings.currency.conversionRate;
  const delta = toBaseUnits(to, conversionRate) - toBaseUnits(from, conversionRate);
  if (delta <= 0) throw new Error('upgrade target rating must be higher than current rating');
  return { from, to, ...compactBasePrice(delta, conversionRate, Math.max(5, to.pointLevel)) };
}

function normalizeBalances(balances = {}, maxLevel = 5, conversionRate = 1000) {
  const out = {};
  for (let i = 1; i <= maxLevel; i += 1) out[pointName(i)] = Number(balances[pointName(i)] || 0);
  for (let i = 1; i < maxLevel; i += 1) {
    const key = pointName(i);
    const next = pointName(i + 1);
    const carry = Math.floor(out[key] / conversionRate);
    if (carry > 0) { out[key] -= carry * conversionRate; out[next] += carry; }
  }
  return out;
}

function canAfford(balances = {}, price, settings) {
  const conversionRate = settings.currency.conversionRate;
  const maxLevel = Math.max(5, price.pointLevel);
  const normalized = normalizeBalances(balances, maxLevel, conversionRate);
  let totalAtPriceLevel = 0;
  for (let level = price.pointLevel; level <= maxLevel; level += 1) totalAtPriceLevel += normalized[pointName(level)] * (conversionRate ** (level - price.pointLevel));
  return totalAtPriceLevel >= price.amount;
}

function deductPrice(balances = {}, price, settings) {
  if (!canAfford(balances, price, settings)) throw new Error('Insufficient reward points');
  const conversionRate = settings.currency.conversionRate;
  const maxLevel = Math.max(5, price.pointLevel);
  const normalized = normalizeBalances(balances, maxLevel, conversionRate);
  let totalBase = 0;
  for (let level = 1; level <= maxLevel; level += 1) totalBase += normalized[pointName(level)] * (conversionRate ** (level - 1));
  totalBase -= price.amount * (conversionRate ** (price.pointLevel - 1));
  return fromBaseUnits(totalBase, conversionRate, maxLevel);
}

function addPoints(balances = {}, amount, pointLevel, settings) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('amount must be positive integer');
  const maxLevel = Math.max(5, pointLevel);
  const b = normalizeBalances(balances, maxLevel, settings.currency.conversionRate);
  b[pointName(pointLevel)] = Number(b[pointName(pointLevel)] || 0) + amount;
  return normalizeBalances(b, maxLevel, settings.currency.conversionRate);
}

function applyDiscount(price, discounts = [], settings, allowZero = false) {
  const conversionRate = settings.currency.conversionRate;
  let base = toBaseUnits(price, conversionRate);
  let rate = 0;
  for (const d of discounts) rate += Number(d.rate || 0);
  rate = Math.max(0, Math.min(1, rate));
  const discounted = Math.floor(base * (1 - rate));
  if (allowZero && discounted === 0) return { amount: 0, pointLevel: 1, display: '0个1级奖励点', baseUnits: 0, discountRate: rate };
  const min = settings.pricing?.minimumDiscountedCost || { amount: 1, pointLevel: 1 };
  const minBase = toBaseUnits(min, conversionRate);
  return { ...compactBasePrice(Math.max(minBase, discounted), conversionRate), discountRate: rate };
}

module.exports = { pointName, parseN, priceForN, upgradeDeltaPrice, normalizeBalances, canAfford, deductPrice, addPoints, applyDiscount, toBaseUnits, fromBaseUnits };
