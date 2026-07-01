export function calculateClearingPrice({ areaHa, density, difficulty, baseRate = 3600, travelCost = 0 }) {
  const densityFactor = density === "high" ? 1.35 : density === "low" ? 0.85 : 1;
  const difficultyFactor = difficulty === "hard" ? 1.25 : difficulty === "easy" ? 0.9 : 1;
  const subtotal = areaHa * baseRate * densityFactor * difficultyFactor;
  return {
    subtotal,
    travelCost,
    total: subtotal + travelCost,
    densityFactor,
    difficultyFactor
  };
}

export function calculateForestPlanPrice({ areaHa, baseFee = 4500, hectareRate = 145, fieldDays = 1, dayRate = 6800 }) {
  const areaPrice = areaHa * hectareRate;
  const fieldPrice = fieldDays * dayRate;
  return {
    baseFee,
    areaPrice,
    fieldPrice,
    total: baseFee + areaPrice + fieldPrice
  };
}

export function calculateQuoteTotal(items = [], vatRate = 25) {
  const subtotal = items.reduce((sum, item) => {
    const quantity = Number.parseFloat(item.quantity) || 0;
    const unitPrice = Number.parseFloat(item.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);
  const vat = subtotal * (vatRate / 100);
  return {
    subtotal,
    vat,
    total: subtotal + vat
  };
}
