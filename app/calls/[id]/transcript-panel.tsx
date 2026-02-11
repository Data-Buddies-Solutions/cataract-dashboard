"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { TranscriptTurn } from "@/lib/types";

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function TranscriptPanel({
  transcript,
  rawData,
  duration,
  turnCount,
  llmCost,
  credits,
}: {
  transcript: TranscriptTurn[] | undefined;
  rawData: unknown;
  duration: number | undefined;
  turnCount: number;
  llmCost: number | undefined;
  credits: number | undefined;
}) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
        Transcript & Raw Data
      </h2>

      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-[400px] rounded-lg border"
      >
        {/* Transcript Panel */}
        <ResizablePanel defaultSize={60} minSize={30}>
          <div className="flex h-full flex-col">
            <div className="border-b px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transcript
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {transcript && transcript.length > 0 ? (
                <div className="space-y-3">
                  {transcript.map((turn, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        turn.role === "agent" ? "items-start" : "items-end"
                      }`}
                    >
                      <span className="mb-0.5 text-xs font-medium uppercase text-muted-foreground">
                        {turn.role}
                        {turn.time_in_call_secs != null &&
                          ` (${turn.time_in_call_secs}s)`}
                      </span>
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          turn.role === "agent"
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {turn.message}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No transcript available.
                </p>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Raw Data Panel */}
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="flex h-full flex-col">
            <div className="border-b px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Raw Payload
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              <pre className="p-4 text-xs text-muted-foreground">
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Call Stats Footer */}
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-muted/50 px-4 py-2.5 text-xs">
        <div>
          <span className="text-muted-foreground">Duration </span>
          <span className="font-medium">
            {duration != null ? formatDuration(duration) : "—"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Turns </span>
          <span className="font-medium">{turnCount}</span>
        </div>
        <div>
          <span className="text-muted-foreground">LLM Cost </span>
          <span className="font-medium">
            {llmCost != null ? `$${llmCost.toFixed(4)}` : "—"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Credits </span>
          <span className="font-medium">
            {credits != null ? credits.toLocaleString() : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
