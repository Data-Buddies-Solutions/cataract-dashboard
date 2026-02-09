import { prisma } from "@/lib/db";
import { AnalyticsStatCard } from "@/app/components/analytics-stat-card";
import { CallVolumeChart } from "@/app/components/charts/call-volume-chart";
import { SuccessRateChart } from "@/app/components/charts/success-rate-chart";
import { VisionScaleDistribution } from "@/app/components/charts/vision-scale-distribution";
import { AffectedActivitiesChart } from "@/app/components/charts/affected-activities-chart";
import { VisionPreferenceChart } from "@/app/components/charts/vision-preference-chart";
import { CallOutcomesOverTime } from "@/app/components/charts/call-outcomes-over-time";
import { DurationTrendChart } from "@/app/components/charts/duration-trend-chart";
import { DataCollectionRateChart } from "@/app/components/charts/data-collection-rate-chart";
import {
  Phone,
  CheckCircle2,
  Clock,
  Eye,
  BarChart3,
} from "lucide-react";

export const dynamic = "force-dynamic";

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseActivities(raw: string): string[] {
  return raw
    .split(/[,;]|\band\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default async function AnalyticsPage() {
  const events = await prisma.webhookEvent.findMany({
    where: { type: "post_call_transcription" },
    orderBy: { createdAt: "asc" },
  });

  // Per-day buckets
  const volumeByDay = new Map<string, number>();
  const durationsByDay = new Map<string, number[]>();
  const outcomesByDay = new Map<
    string,
    { success: number; failure: number }
  >();

  // Counters
  let totalCalls = 0;
  let totalDurationSecs = 0;
  let successCount = 0;
  let failureCount = 0;
  let otherCount = 0;
  let totalVisionScale = 0;
  let visionScaleCount = 0;
  let hasVisionScaleCount = 0;
  let hasActivitiesCount = 0;
  let hasPreferenceCount = 0;

  // Distribution maps
  const visionScaleCounts = new Map<number, number>();
  const activityCounts = new Map<string, number>();
  const preferenceCounts = new Map<string, number>();

  for (const event of events) {
    const dateKey = toDateKey(event.createdAt);
    totalCalls++;

    // Volume
    volumeByDay.set(dateKey, (volumeByDay.get(dateKey) ?? 0) + 1);

    // Duration
    if (event.callDurationSecs != null) {
      totalDurationSecs += event.callDurationSecs;
      const arr = durationsByDay.get(dateKey) ?? [];
      arr.push(event.callDurationSecs);
      durationsByDay.set(dateKey, arr);
    }

    // Success/failure
    if (event.callSuccessful === true) {
      successCount++;
      const o = outcomesByDay.get(dateKey) ?? { success: 0, failure: 0 };
      o.success++;
      outcomesByDay.set(dateKey, o);
    } else if (event.callSuccessful === false) {
      failureCount++;
      const o = outcomesByDay.get(dateKey) ?? { success: 0, failure: 0 };
      o.failure++;
      outcomesByDay.set(dateKey, o);
    } else {
      otherCount++;
    }

    // Vision scale
    if (event.visionScale != null) {
      totalVisionScale += event.visionScale;
      visionScaleCount++;
      hasVisionScaleCount++;
      visionScaleCounts.set(
        event.visionScale,
        (visionScaleCounts.get(event.visionScale) ?? 0) + 1
      );
    }

    // Activities
    if (event.activities) {
      hasActivitiesCount++;
      const parsed = parseActivities(event.activities);
      for (const activity of parsed) {
        const normalized = activity.toLowerCase();
        activityCounts.set(
          normalized,
          (activityCounts.get(normalized) ?? 0) + 1
        );
      }
    }

    // Vision preference
    if (event.visionPreference) {
      hasPreferenceCount++;
      const pref = event.visionPreference.toLowerCase();
      preferenceCounts.set(pref, (preferenceCounts.get(pref) ?? 0) + 1);
    }
  }

  // Build chart data
  const sortedDays = [...volumeByDay.keys()].sort();

  const callVolumeData = sortedDays.map((date) => ({
    date,
    count: volumeByDay.get(date) ?? 0,
  }));

  const successRateData = [
    { name: "Success", value: successCount },
    { name: "Failure", value: failureCount },
    { name: "Unknown", value: otherCount },
  ];

  const visionScaleData = Array.from({ length: 10 }, (_, i) => ({
    scale: String(i + 1),
    count: visionScaleCounts.get(i + 1) ?? 0,
  }));

  const activitiesData = [...activityCounts.entries()]
    .map(([activity, count]) => ({
      activity: activity.charAt(0).toUpperCase() + activity.slice(1),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const preferenceData = [...preferenceCounts.entries()]
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const outcomesOverTimeData = sortedDays.map((date) => ({
    date,
    success: outcomesByDay.get(date)?.success ?? 0,
    failure: outcomesByDay.get(date)?.failure ?? 0,
  }));

  const durationTrendData = sortedDays
    .filter((d) => durationsByDay.has(d))
    .map((date) => {
      const vals = durationsByDay.get(date)!;
      return {
        date,
        avgDuration: vals.reduce((a, b) => a + b, 0) / vals.length,
      };
    });

  const dataCollectionRateData = [
    {
      field: "Vision Scale",
      rate: totalCalls > 0 ? (hasVisionScaleCount / totalCalls) * 100 : 0,
    },
    {
      field: "Activities",
      rate: totalCalls > 0 ? (hasActivitiesCount / totalCalls) * 100 : 0,
    },
    {
      field: "Preference",
      rate: totalCalls > 0 ? (hasPreferenceCount / totalCalls) * 100 : 0,
    },
  ];

  // Summary stats
  const avgDuration = totalCalls > 0 ? totalDurationSecs / totalCalls : 0;
  const successRate =
    totalCalls > 0 ? ((successCount / totalCalls) * 100).toFixed(1) : "0";
  const avgVisionScale =
    visionScaleCount > 0
      ? (totalVisionScale / visionScaleCount).toFixed(1)
      : "—";
  const dataCollectionRate =
    totalCalls > 0
      ? (
          ((hasVisionScaleCount + hasActivitiesCount + hasPreferenceCount) /
            (totalCalls * 3)) *
          100
        ).toFixed(0)
      : "0";

  // Adaptive color for vision scale
  const avgVisionNum = visionScaleCount > 0 ? totalVisionScale / visionScaleCount : 0;
  const visionIconColor =
    avgVisionNum <= 3
      ? "bg-medical-success-light text-medical-success"
      : avgVisionNum <= 6
        ? "bg-medical-warning-light text-medical-warning"
        : "bg-medical-critical-light text-medical-critical";
  const visionBgClass =
    avgVisionNum <= 3
      ? "bg-medical-success-light/30"
      : avgVisionNum <= 6
        ? "bg-medical-warning-light/30"
        : "bg-medical-critical-light/30";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggregate insights across all patient calls
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <AnalyticsStatCard
          label="Total Calls"
          value={String(totalCalls)}
          icon={Phone}
          iconColorClass="bg-medical-info-light text-medical-info"
          bgClass="bg-medical-info-light/30"
        />
        <AnalyticsStatCard
          label="Success Rate"
          value={`${successRate}%`}
          icon={CheckCircle2}
          iconColorClass="bg-medical-success-light text-medical-success"
          bgClass="bg-medical-success-light/30"
        />
        <AnalyticsStatCard
          label="Avg Duration"
          value={`${avgDuration.toFixed(1)}s`}
          icon={Clock}
          iconColorClass="bg-medical-purple-light text-medical-purple"
          bgClass="bg-medical-purple-light/30"
        />
        <AnalyticsStatCard
          label="Avg Vision Scale"
          value={avgVisionScale}
          icon={Eye}
          iconColorClass={visionIconColor}
          bgClass={visionBgClass}
        />
        <AnalyticsStatCard
          label="Data Collection"
          value={`${dataCollectionRate}%`}
          icon={BarChart3}
          iconColorClass="bg-medical-info-light text-medical-info"
          bgClass="bg-medical-info-light/30"
        />
      </div>

      {/* Charts Grid - ordered by clinical importance */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CallVolumeChart data={callVolumeData} />
        <SuccessRateChart data={successRateData} />
        <VisionScaleDistribution data={visionScaleData} />
        <CallOutcomesOverTime data={outcomesOverTimeData} />
        <AffectedActivitiesChart data={activitiesData} />
        <VisionPreferenceChart data={preferenceData} />
        <DurationTrendChart data={durationTrendData} />
        <DataCollectionRateChart data={dataCollectionRateData} />
      </div>
    </main>
  );
}
