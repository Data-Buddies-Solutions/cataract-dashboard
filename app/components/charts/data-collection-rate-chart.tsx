"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "../empty-state";

function rateColorClass(rate: number): string {
  if (rate >= 80) return "[&_[data-slot=progress-indicator]]:bg-medical-success";
  if (rate >= 50) return "[&_[data-slot=progress-indicator]]:bg-medical-warning";
  return "[&_[data-slot=progress-indicator]]:bg-medical-critical";
}

function rateLabel(rate: number): string {
  if (rate >= 80) return "text-medical-success";
  if (rate >= 50) return "text-medical-warning";
  return "text-medical-critical";
}

export function DataCollectionRateChart({
  data,
}: {
  data: { field: string; rate: number }[];
}) {
  if (data.length === 0) {
    return <EmptyState label="Data Collection Rate" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Data Collection Rate</CardTitle>
        <CardDescription>Percentage of calls with each data point collected</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {data.map((item) => (
          <div key={item.field} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.field}</span>
              <span className={`font-semibold tabular-nums ${rateLabel(item.rate)}`}>
                {item.rate.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={item.rate}
              className={`h-2.5 ${rateColorClass(item.rate)}`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
