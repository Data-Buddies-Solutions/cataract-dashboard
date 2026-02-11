"use client";

import { useEffect, useState } from "react";
import { Label, PolarGrid, RadialBar, RadialBarChart } from "recharts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { PropensityTier } from "@/lib/propensity-scoring";

const tierColors: Record<PropensityTier, string> = {
  high: "var(--medical-success)",
  moderate: "var(--medical-warning)",
  low: "var(--medical-info)",
  insufficient: "var(--medical-neutral)",
};

const chartConfig = {
  score: { label: "Score" },
} satisfies ChartConfig;

// Ease-out cubic
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function PropensityGauge({
  score,
  label,
  tier,
}: {
  score: number;
  label: string;
  tier: PropensityTier;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (tier === "insufficient") {
      setAnimatedScore(0);
      return;
    }

    const duration = 1500; // ms
    let start: number | null = null;
    let frameId: number;

    function animate(timestamp: number) {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      setAnimatedScore(Math.round(easeOutCubic(progress) * score));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    }

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [score, tier]);

  const color = tierColors[tier];
  const displayScore = tier === "insufficient" ? 0 : score;

  const chartData = [
    { name: "score", value: displayScore, fill: color },
  ];

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium">
          IOL Upgrade Propensity
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="100%"
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[72, 58]}
            />
            <RadialBar
              dataKey="value"
              background
              cornerRadius={10}
              maxBarSize={100}
            />
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              <tspan
                x="50%"
                dy="-8"
                className="fill-foreground text-3xl font-bold"
              >
                {tier === "insufficient" ? "—" : `${animatedScore}%`}
              </tspan>
              <tspan
                x="50%"
                dy="20"
                className="fill-muted-foreground text-[11px]"
              >
                Propensity Score
              </tspan>
            </text>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="justify-center pt-0 pb-4">
        <p className="text-center text-xs text-muted-foreground">{label}</p>
      </CardFooter>
    </Card>
  );
}
