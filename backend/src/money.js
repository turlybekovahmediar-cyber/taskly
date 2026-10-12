export const FEE = 0.05;
export const commission = (price) => {
  const p = Math.max(0, Math.round(Number(price) || 0));
  const fee = Math.round(p * FEE);
  return { price: p, fee, payout: p - fee };
};
export const money = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₸';
