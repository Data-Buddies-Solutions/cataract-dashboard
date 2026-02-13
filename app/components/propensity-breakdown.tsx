import { Progress } from "@/components/ui/progress";
import type { PropensityFactor } from "@/lib/propensity-scoring";

export function PropensityBreakdown({ factors }: { factors: PropensityFactor[] }) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
        Score Breakdown
      </h3>
      <div className="space-y-3">
        {factors.map((factor) => (
          <div key={factor.name}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium sm:text-sm">{factor.name}</span>
              <span className="text-xs text-muted-foreground">
                {factor.score != null ? (
                  <>
                    {factor.score}%
                    <span className="ml-1.5 text-[10px] text-muted-foreground/60">
                      ({Math.round(factor.weight * 100)}% weight)
                    </span>
                  </>
                ) : (
                  "No data"
                )}
              </span>
            </div>
            {factor.score != null ? (
              <Progress
                value={factor.score}
                className="h-2"
              />
            ) : (
              <div className="h-2 rounded-full bg-muted" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
