"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartWrapper } from "../chart-wrapper";
import { EmptyState } from "../empty-state";

export function DataCollectionRateChart({
  data,
}: {
  data: { field: string; rate: number }[];
}) {
  if (data.length === 0) {
    return <EmptyState label="Data Collection Rate" />;
  }

  return (
    <ChartWrapper title="Data Collection Rate">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="field" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
          />
          <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
          <Bar dataKey="rate" fill="#14b8a6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
