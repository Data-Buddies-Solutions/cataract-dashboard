"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { EmptyState } from "../empty-state";

const chartConfig = {
  avgDuration: {
    label: "Avg Duration",
    color: "var(--medical-purple)",
  },
} satisfies ChartConfig;

export function DurationTrendChart({
  data,
}: {
  data: { date: string; avgDuration: number }[];
}) {
  if (data.length === 0) {
    return <EmptyState label="Avg Call Duration Over Time" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Avg Call Duration Over Time</CardTitle>
        <CardDescription>Average call length per day in seconds</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <AreaChart accessibilityLayer data={data}>
            <defs>
              <linearGradient id="fillDuration" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-avgDuration)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-avgDuration)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => `${v.toFixed(0)}s`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${Number(value).toFixed(1)}s`}
                />
              }
            />
            <Area
              type="natural"
              dataKey="avgDuration"
              stroke="var(--color-avgDuration)"
              strokeWidth={2}
              fill="url(#fillDuration)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
