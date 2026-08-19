export const LOAN_TERMS = [24, 36, 48, 60] as const;
export type LoanTerm = (typeof LOAN_TERMS)[number];
export const WEEKS_PER_MONTH = 4.33;

export type RatioTone = "ok" | "warn" | "loss";

export type CarAffordInput = {
  salaryNet: number;
  price: number;
  downPayment: number;
  annualRatePct: number;
  termMonths: LoanTerm;
  insuranceAnnual: number;
  uberRider: boolean;
  uberRiderMonthly: number;
  gasMonthly: number;
  maintenanceAmount: number;
  maintenancePeriod: "month" | "year";
  saaqAnnual: number;
  uberDaysPerWeek: number;
  uberNetPerDay: number;
  livingMonthly: number;
};

export type LoanQuote = {
  principal: number;
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
};

export type CarAffordResult = {
  loan: LoanQuote;
  insuranceMonthly: number;
  riderMonthly: number;
  maintenanceMonthly: number;
  saaqMonthly: number;
  gasMonthly: number;
  vehicleMonthly: number;
  salaryRatioPct: number;
  salaryTone: RatioTone;
  uberMonthly: number;
  ratioWithUberPct: number | null;
  uberSharePct: number;
  netBalance: number;
  dependsOnUber: boolean;
};

export type CarRisk = {
  id: string;
  level: RatioTone;
  key: string;
};

function finite(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

export function ratioTone(pct: number): RatioTone {
  if (pct < 20) return "ok";
  if (pct <= 35) return "warn";
  return "loss";
}

export function amortize(
  principal: number,
  annualRatePct: number,
  termMonths: number,
): LoanQuote {
  const P = finite(principal);
  const n = Math.max(1, Math.round(finite(termMonths)));
  const monthlyRate = finite(annualRatePct) / 100 / 12;

  if (P === 0) {
    return { principal: 0, monthlyPayment: 0, totalPaid: 0, totalInterest: 0 };
  }

  const monthlyPayment =
    monthlyRate === 0
      ? P / n
      : (P * monthlyRate * (1 + monthlyRate) ** n) /
        ((1 + monthlyRate) ** n - 1);

  const totalPaid = monthlyPayment * n;
  return {
    principal: P,
    monthlyPayment,
    totalPaid,
    totalInterest: Math.max(0, totalPaid - P),
  };
}

export function evaluateCarAffordability(input: CarAffordInput): CarAffordResult {
  const salaryNet = finite(input.salaryNet);
  const price = finite(input.price);
  const downPayment = Math.min(finite(input.downPayment), price);
  const principal = Math.max(0, price - downPayment);
  const loan = amortize(principal, input.annualRatePct, input.termMonths);

  const insuranceMonthly = finite(input.insuranceAnnual) / 12;
  const riderMonthly = input.uberRider ? finite(input.uberRiderMonthly) : 0;
  const maintenanceMonthly =
    input.maintenancePeriod === "year"
      ? finite(input.maintenanceAmount) / 12
      : finite(input.maintenanceAmount);
  const saaqMonthly = finite(input.saaqAnnual) / 12;
  const gasMonthly = finite(input.gasMonthly);

  const vehicleMonthly =
    loan.monthlyPayment +
    insuranceMonthly +
    riderMonthly +
    gasMonthly +
    maintenanceMonthly +
    saaqMonthly;

  const salaryRatioPct = salaryNet > 0 ? (vehicleMonthly / salaryNet) * 100 : 0;
  const uberMonthly =
    finite(input.uberDaysPerWeek) * finite(input.uberNetPerDay) * WEEKS_PER_MONTH;
  const combinedIncome = salaryNet + uberMonthly;
  const ratioWithUberPct =
    combinedIncome > 0 ? (vehicleMonthly / combinedIncome) * 100 : null;
  const uberSharePct =
    vehicleMonthly > 0 ? Math.min(100, (uberMonthly / vehicleMonthly) * 100) : 0;
  const netBalance =
    salaryNet + uberMonthly - vehicleMonthly - finite(input.livingMonthly);

  return {
    loan,
    insuranceMonthly,
    riderMonthly,
    maintenanceMonthly,
    saaqMonthly,
    gasMonthly,
    vehicleMonthly,
    salaryRatioPct,
    salaryTone: ratioTone(salaryRatioPct),
    uberMonthly,
    ratioWithUberPct,
    uberSharePct,
    netBalance,
    dependsOnUber: salaryNet > 0 && salaryRatioPct > 35,
  };
}

export function assessCarRisks(
  input: CarAffordInput,
  result: CarAffordResult,
): CarRisk[] {
  const risks: CarRisk[] = [];
  const price = finite(input.price);
  const down = finite(input.downPayment);
  const rate = finite(input.annualRatePct);

  if (result.dependsOnUber) {
    risks.push({ id: "uber", level: "loss", key: "car.risk.uberDepend" });
  } else if (result.salaryTone === "warn") {
    risks.push({ id: "ratio", level: "warn", key: "car.risk.ratioAmber" });
  }

  if (
    result.dependsOnUber &&
    result.ratioWithUberPct !== null &&
    result.ratioWithUberPct > 35
  ) {
    risks.push({ id: "stillHigh", level: "loss", key: "car.risk.stillHigh" });
  }

  if (result.netBalance < 0) {
    risks.push({ id: "negative", level: "loss", key: "car.risk.negative" });
  } else if (result.netBalance < 250 && input.salaryNet > 0) {
    risks.push({ id: "thin", level: "warn", key: "car.risk.thin" });
  }

  if (rate >= 10) {
    risks.push({ id: "rate", level: "loss", key: "car.risk.rateHigh" });
  } else if (rate >= 8) {
    risks.push({ id: "rate", level: "warn", key: "car.risk.rateWeak" });
  }

  if (price > 0 && down / price < 0.1) {
    risks.push({ id: "down", level: "warn", key: "car.risk.down" });
  }

  if (finite(input.uberDaysPerWeek) >= 6) {
    risks.push({ id: "days", level: "warn", key: "car.risk.uberDays" });
  }

  if (finite(input.insuranceAnnual) >= 2000) {
    risks.push({ id: "ins", level: "warn", key: "car.risk.insurance" });
  }

  if (price > 0 && result.loan.totalInterest / price > 0.25) {
    risks.push({ id: "interest", level: "warn", key: "car.risk.interest" });
  }

  if (risks.length === 0 && result.salaryTone === "ok" && input.salaryNet > 0) {
    risks.push({ id: "ok", level: "ok", key: "car.risk.ok" });
  }

  return risks;
}
