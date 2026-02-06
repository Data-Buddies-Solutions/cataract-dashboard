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

export function CallVolumeChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  if (data.length === 0) {
    return <EmptyState label="Call Volume Over Time" />;
  }

  return (
    <ChartWrapper title="Call Volume Over Time">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
