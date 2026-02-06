"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { ChartWrapper } from "../chart-wrapper";
import { EmptyState } from "../empty-state";

function scaleColor(scale: number): string {
  if (scale <= 3) return "#22c55e";
  if (scale <= 6) return "#f59e0b";
  return "#ef4444";
}

export function VisionScaleDistribution({
  data,
}: {
  data: { scale: string; count: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return <EmptyState label="Vision Scale Distribution" />;
  }

  return (
    <ChartWrapper title="Vision Scale Distribution">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="scale" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.scale} fill={scaleColor(parseInt(entry.scale))} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
