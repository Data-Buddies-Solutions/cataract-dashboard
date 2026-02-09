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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { EmptyState } from "../empty-state";

const chartConfig = {
  success: {
    label: "Success",
    color: "var(--medical-success)",
  },
  failure: {
    label: "Failure",
    color: "var(--medical-critical)",
  },
} satisfies ChartConfig;

export function CallOutcomesOverTime({
  data,
}: {
  data: { date: string; success: number; failure: number }[];
}) {
  if (data.length === 0) {
    return <EmptyState label="Call Outcomes Over Time" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Call Outcomes Over Time</CardTitle>
        <CardDescription>Success vs failure trends by day</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <AreaChart accessibilityLayer data={data}>
            <defs>
              <linearGradient id="fillSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillFailure" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-failure)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-failure)" stopOpacity={0.05} />
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
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="natural"
              dataKey="success"
              stackId="1"
              stroke="var(--color-success)"
              strokeWidth={2}
              fill="url(#fillSuccess)"
            />
            <Area
              type="natural"
              dataKey="failure"
              stackId="1"
              stroke="var(--color-failure)"
              strokeWidth={2}
              fill="url(#fillFailure)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
