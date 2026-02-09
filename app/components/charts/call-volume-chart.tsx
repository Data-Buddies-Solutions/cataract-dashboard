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
  count: {
    label: "Calls",
    color: "var(--medical-info)",
  },
} satisfies ChartConfig;

export function CallVolumeChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  if (data.length === 0) {
    return <EmptyState label="Call Volume Over Time" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Call Volume Over Time</CardTitle>
        <CardDescription>Daily call counts across all patients</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <AreaChart accessibilityLayer data={data}>
            <defs>
              <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.05} />
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
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="natural"
              dataKey="count"
              stroke="var(--color-count)"
              strokeWidth={2}
              fill="url(#fillVolume)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
