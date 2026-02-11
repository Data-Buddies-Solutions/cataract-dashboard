"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
} from "recharts";
import {
  Card,
  CardContent,
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
import type { RadarAxisData } from "@/lib/propensity-scoring";

const chartConfig = {
  patientNeeds: {
    label: "Patient Needs",
    color: "var(--medical-info)",
  },
  iolStrengths: {
    label: "Premium IOL Strengths",
    color: "var(--medical-success)",
  },
} satisfies ChartConfig;

export function LifestyleRadar({ data }: { data: RadarAxisData[] }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium">
          Lifestyle Match Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[280px]"
        >
          <RadarChart data={data} outerRadius="65%">
            <ChartTooltip
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <PolarGrid gridType="circle" />
            <Radar
              name="patientNeeds"
              dataKey="patientNeeds"
              fill="var(--color-patientNeeds)"
              fillOpacity={0.4}
              stroke="var(--color-patientNeeds)"
              strokeWidth={1.5}
            />
            <Radar
              name="iolStrengths"
              dataKey="iolStrengths"
              fill="var(--color-iolStrengths)"
              fillOpacity={0.3}
              stroke="var(--color-iolStrengths)"
              strokeWidth={1.5}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
