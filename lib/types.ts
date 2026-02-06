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
