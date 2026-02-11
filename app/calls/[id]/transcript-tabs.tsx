"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TranscriptTurn } from "@/lib/types";

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function TranscriptTabs({
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
      <Tabs defaultValue="transcript">
        <TabsList>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="raw">Raw Payload</TabsTrigger>
        </TabsList>

        <TabsContent value="transcript">
          {transcript && transcript.length > 0 ? (
            <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
              {transcript.map((turn, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    turn.role === "agent" ? "items-start" : "items-end"
                  }`}
                >
                  <span className="mb-0.5 text-xs font-medium uppercase text-gray-400">
                    {turn.role}
                    {turn.time_in_call_secs != null &&
                      ` (${turn.time_in_call_secs}s)`}
                  </span>
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      turn.role === "agent"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-blue-600 text-white"
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
        </TabsContent>

        <TabsContent value="raw">
          <pre className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-900 p-4 text-sm text-green-400">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </TabsContent>
      </Tabs>

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
