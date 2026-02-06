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

export function AffectedActivitiesChart({
  data,
}: {
  data: { activity: string; count: number }[];
}) {
  if (data.length === 0) {
    return <EmptyState label="Most Affected Activities" />;
  }

  return (
    <ChartWrapper title="Most Affected Activities">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="activity"
            width={140}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
