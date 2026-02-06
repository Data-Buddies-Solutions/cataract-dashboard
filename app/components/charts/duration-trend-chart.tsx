"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartWrapper } from "../chart-wrapper";
import { EmptyState } from "../empty-state";

export function DurationTrendChart({
  data,
}: {
  data: { date: string; avgDuration: number }[];
}) {
  if (data.length === 0) {
    return <EmptyState label="Avg Call Duration Over Time" />;
  }

  return (
    <ChartWrapper title="Avg Call Duration Over Time">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${v.toFixed(0)}s`}
          />
          <Tooltip formatter={(v) => `${Number(v).toFixed(1)}s`} />
          <Line
            type="monotone"
            dataKey="avgDuration"
            name="Avg Duration"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
