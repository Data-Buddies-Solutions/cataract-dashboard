export function VisionScaleBadge({ scale }: { scale: number | null }) {
  if (scale === null) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  let colorClass: string;
  if (scale <= 3) {
    colorClass = "border-green-200 bg-green-50 text-green-700";
  } else if (scale <= 6) {
    colorClass = "border-amber-200 bg-amber-50 text-amber-700";
  } else {
    colorClass = "border-red-200 bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
    >
      {scale}
    </span>
  );
}
