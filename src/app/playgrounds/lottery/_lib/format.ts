const gbp0 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const num = new Intl.NumberFormat("en-GB");

/** Whole-pound currency, e.g. £6,700,000. */
export function money(value: number): string {
  return gbp0.format(value);
}

/** Thousands-separated integer, e.g. 1,019. */
export function count(value: number): string {
  return num.format(value);
}

/** Compact signed currency for the net figure, e.g. −£1,420 or +£30. */
export function signedMoney(value: number): string {
  if (value === 0) return money(0);
  const sign = value > 0 ? "+" : "−";
  return `${sign}${money(Math.abs(value))}`;
}
