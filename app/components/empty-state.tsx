import { ChartWrapper } from "./chart-wrapper";

export function EmptyState({ label }: { label: string }) {
  return (
    <ChartWrapper title={label}>
      <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
        No data available
      </div>
    </ChartWrapper>
  );
}
