import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AnalyticsStatCard({
  label,
  value,
  icon: Icon,
  iconColorClass,
  bgClass,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColorClass: string;
  bgClass: string;
}) {
  return (
    <Card className={`relative overflow-hidden py-4 ${bgClass}`}>
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconColorClass}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </CardContent>
    </Card>
  );
}
