"use client";

import { useMemo } from "react";
import { Pie, PieChart } from "recharts";
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

const PALETTE = [
  "var(--medical-info)",
  "var(--medical-purple)",
  "var(--medical-success)",
  "var(--medical-warning)",
  "var(--medical-critical)",
  "var(--medical-neutral)",
];

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

export function VisionPreferenceChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      value: { label: "Patients" },
    };
    data.forEach((d, i) => {
      config[d.name] = {
        label: truncate(d.name, 25),
        color: PALETTE[i % PALETTE.length],
      };
    });
    return config;
  }, [data]);

  if (total === 0) {
    return <EmptyState label="Vision Preference Distribution" />;
  }

  const chartData = data.map((d, i) => ({
    ...d,
    fill: PALETTE[i % PALETTE.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Vision Preference Distribution</CardTitle>
        <CardDescription>Post-surgery vision goals reported by patients</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[300px]">
          <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              strokeWidth={2}
            />
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
