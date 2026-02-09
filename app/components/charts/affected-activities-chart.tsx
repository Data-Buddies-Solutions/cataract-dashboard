"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
    label: "Reports",
    color: "var(--medical-info)",
  },
} satisfies ChartConfig;

export function AffectedActivitiesChart({
  data,
}: {
  data: { activity: string; count: number }[];
}) {
  if (data.length === 0) {
    return <EmptyState label="Most Affected Activities" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Most Affected Activities</CardTitle>
        <CardDescription>Top activities impacted by vision issues</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <BarChart accessibilityLayer data={data} layout="vertical">
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              type="category"
              dataKey="activity"
              width={140}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
