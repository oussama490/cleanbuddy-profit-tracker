export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(round2(amount));
}

export function formatHours(hours: number): string {
  const rounded = round2(hours);
  const formatted = new Intl.NumberFormat("fr-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);
  return `${formatted} h`;
}

export function formatHoursPlain(hours: number): string {
  return new Intl.NumberFormat("fr-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(round2(hours));
}

export function formatRate(rate: number): string {
  return `${formatMoney(rate)}/h`;
}

export function pluralHours(hours: number, hourWord: string, hoursWord: string): string {
  const plain = formatHoursPlain(hours);
  return Math.abs(round2(hours)) === 1 ? `${plain} ${hourWord}` : `${plain} ${hoursWord}`;
}
