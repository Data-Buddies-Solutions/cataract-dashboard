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

const chartConfig = {
  scale: {
    label: "Vision Scale",
    color: "var(--medical-critical)",
  },
} satisfies ChartConfig;

export function VisionScaleOverTimeChart({
  data,
}: {
  data: { date: string; scale: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Vision Scale Over Time</CardTitle>
        <CardDescription>Patient-reported vision impact across calls</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <AreaChart accessibilityLayer data={data}>
            <defs>
              <linearGradient id="fillScale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-scale)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-scale)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              domain={[1, 10]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="natural"
              dataKey="scale"
              stroke="var(--color-scale)"
              strokeWidth={2}
              fill="url(#fillScale)"
              dot={{ r: 4, fill: "var(--color-scale)" }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
