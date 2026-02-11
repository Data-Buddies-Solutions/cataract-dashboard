export function CallOutcomeBadge({
  successful,
}: {
  successful: boolean | null;
}) {
  if (successful === true) {
    return (
      <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
        Successful
      </span>
    );
  }
  if (successful === false) {
    return (
      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      Unknown
    </span>
  );
}
