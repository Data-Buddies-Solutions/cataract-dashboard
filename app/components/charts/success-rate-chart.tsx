"use client";

import { Label, Pie, PieChart } from "recharts";
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
  value: {
    label: "Count",
  },
  Success: {
    label: "Success",
    color: "var(--medical-success)",
  },
  Failure: {
    label: "Failure",
    color: "var(--medical-critical)",
  },
  Unknown: {
    label: "Unknown",
    color: "var(--medical-neutral)",
  },
} satisfies ChartConfig;

export function SuccessRateChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <EmptyState label="Success Rate" />;
  }

  const successItem = data.find((d) => d.name === "Success");
  const successPct =
    successItem && total > 0
      ? ((successItem.value / total) * 100).toFixed(0)
      : "0";

  const chartData = data
    .filter((d) => d.value > 0)
    .map((d) => ({ ...d, fill: `var(--color-${d.name})` }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
        <CardDescription>Call outcome distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[300px]"
        >
          <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={110}
              strokeWidth={2}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {successPct}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Success Rate
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
