"use client";

import { convertFromCad } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import type { DailyEntry } from "@/lib/types";
import { useDisplayCurrency } from "./DisplayCurrency";
import {
  CartesianGrid,
  Legend,
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
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 29);
  cutoff.setHours(0, 0, 0, 0);

  const points: Point[] = [...entries]
    .filter((entry) => new Date(`${entry.entry_date}T00:00:00`) >= cutoff)
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
    .map((entry) => {
      const revenueCad = Number(entry.revenue_amount) * entry.exchange_rate_snapshot.toCad[entry.revenue_currency];
      const adsCad = Number(entry.ads_cost_amount) * entry.exchange_rate_snapshot.toCad[entry.ads_cost_currency];
      const profitCad = revenueCad - adsCad - Number(entry.delivered) * unitCogsCad;
      return {
        date: entry.entry_date.slice(5),
        revenue: convertFromCad(revenueCad, currency, entry.exchange_rate_snapshot),
        profit: convertFromCad(profitCad, currency, entry.exchange_rate_snapshot),
      };
    });

  if (points.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500">
        لا توجد بيانات خلال آخر 30 يوماً لعرض الرسم البياني.
      </p>
    );
  }

  return (
    <div className="cb-card" dir="ltr">
      <h2 className="mb-4 text-right text-base font-semibold text-stone-900">
        تطور الإيرادات وصافي الربح — 30 يوماً ({currency})
      </h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#57534e" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "#57534e" }}
              width={56}
              tickFormatter={(value: number) =>
                new Intl.NumberFormat("en", { notation: "compact" }).format(value)
              }
            />
            <Tooltip
              formatter={(value, name) => [
                formatMoney(Number(value ?? 0), currency),
                name === "profit" ? "صافي الربح" : "الإيرادات",
              ]}
            />
            <Legend
              formatter={(value) => (value === "profit" ? "صافي الربح" : "الإيرادات")}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#0f766e"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#b45309"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
