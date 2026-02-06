"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartWrapper } from "../chart-wrapper";
import { EmptyState } from "../empty-state";

export function CallOutcomesOverTime({
  data,
}: {
  data: { date: string; success: number; failure: number }[];
}) {
  if (data.length === 0) {
    return <EmptyState label="Call Outcomes Over Time" />;
  }

  return (
    <ChartWrapper title="Call Outcomes Over Time">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="success"
            stackId="1"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="failure"
            stackId="1"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
