"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
    label: "Patients",
    color: "var(--medical-info)",
  },
} satisfies ChartConfig;

function scaleColor(scale: number): string {
  if (scale <= 3) return "var(--medical-success)";
  if (scale <= 6) return "var(--medical-warning)";
  return "var(--medical-critical)";
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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Vision Scale Distribution</CardTitle>
        <CardDescription>Patient-reported vision impact (1-10)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="scale"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.scale}
                  fill={scaleColor(parseInt(entry.scale))}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-medical-success" />
          Low (1-3)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-medical-warning" />
          Moderate (4-6)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-medical-critical" />
          High (7-10)
        </div>
      </CardFooter>
    </Card>
  );
}
