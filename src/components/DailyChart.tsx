"use client";

import { convertFromCad } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import type { DailyEntry } from "@/lib/types";
import { useDisplayCurrency } from "./DisplayCurrency";
import { usePrefs } from "./PrefsProvider";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  date: string;
  revenue: number;
  profit: number;
};

export function DailyChart({
  entries,
  unitCogsCad,
}: {
  entries: DailyEntry[];
  unitCogsCad: number;
}) {
  const { currency } = useDisplayCurrency();
  const { t } = usePrefs();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 29);
  cutoff.setHours(0, 0, 0, 0);

  const points: Point[] = [...entries]
    .filter((entry) => new Date(`${entry.entry_date}T00:00:00`) >= cutoff)
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
    .map((entry) => {
      const revenueCad =
        Number(entry.revenue_amount) *
        entry.exchange_rate_snapshot.toCad[entry.revenue_currency];
      const adsCad =
        Number(entry.ads_cost_amount) *
        entry.exchange_rate_snapshot.toCad[entry.ads_cost_currency];
      const profitCad = revenueCad - adsCad - Number(entry.delivered) * unitCogsCad;
      return {
        date: entry.entry_date.slice(5),
        revenue: convertFromCad(revenueCad, currency, entry.exchange_rate_snapshot),
        profit: convertFromCad(profitCad, currency, entry.exchange_rate_snapshot),
      };
    });

  if (points.length === 0) {
    return (
      <p className="rounded-[var(--radius)] border border-dashed border-line bg-card px-4 py-10 text-center text-sm text-muted">
        {t("chart.empty")}
      </p>
    );
  }

  return (
    <div className="cb-card">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="cb-kicker">{currency}</p>
          <h2 className="mt-1 text-[15px] font-semibold">{t("chart.title")}</h2>
        </div>
        <div className="flex gap-4 text-[11px] font-medium text-muted">
          <span className="inline-flex items-center gap-1.5">
            <i className="h-1.5 w-1.5 rounded-full bg-[var(--chart-revenue)]" />
            {t("chart.revenue")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="h-1.5 w-1.5 rounded-full bg-[var(--led)]" />
            {t("chart.profit")}
          </span>
        </div>
      </div>
      <div className="h-48 w-full overflow-hidden sm:h-56" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(value: number) =>
                new Intl.NumberFormat("en", { notation: "compact" }).format(value)
              }
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value, name) => [
                formatMoney(Number(value ?? 0), currency),
                name === "profit" ? t("chart.profit") : t("chart.revenue"),
              ]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--chart-revenue)"
              strokeWidth={1.75}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="var(--led)"
              strokeWidth={1.75}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
