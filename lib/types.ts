export type CallStatus =
  | "pending"
  | "queued"
  | "retry"
  | "answered"
  | "completed";

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  pending: "Pending",
  queued: "Queued",
  retry: "Needs Retry",
  answered: "Answered",
  completed: "Completed",
};

export function normalizeCallStatus(status: string): CallStatus {
  if (status === "called") return "answered";
  if (
    status === "pending" ||
    status === "queued" ||
    status === "retry" ||
    status === "answered" ||
    status === "completed"
  ) {
    return status;
  }
  return "pending";
}

export function getCallStatusLabel(status: string): string {
  if (status === "called") return CALL_STATUS_LABELS.answered;
  const normalized = normalizeCallStatus(status);
  return CALL_STATUS_LABELS[normalized];
}

export interface TranscriptTurn {
  role: string;
  message: string;
  time_in_call_secs?: number;
  tool_calls?: { name?: string; tool_name?: string }[];
}

export interface DataCollectionEntry {
  value: string;
  rationale: string;
  data_collection_id: string;
  json_schema?: { description?: string };
}

export interface EvaluationCriteriaEntry {
  result: string;
  rationale: string;
  criteria_id: string;
}

export interface EventData {
  metadata?: {
    call_duration_secs?: number;
    cost?: number;
    start_time_unix_secs?: number;
    termination_reason?: string;
    charging?: {
      llm_price?: number;
      call_charge?: number;
      llm_usage?: {
        initiated_generation?: {
          model_usage?: Record<
            string,
            {
              input?: { tokens?: number; price?: number };
              output_total?: { tokens?: number; price?: number };
            }
          >;
        };
      };
    };
  };
  analysis?: {
    call_successful?: string | boolean;
    transcript_summary?: string;
    data_collection_results?: Record<string, DataCollectionEntry>;
    evaluation_criteria_results?: Record<string, EvaluationCriteriaEntry>;
  };
  transcript?: TranscriptTurn[];
}
