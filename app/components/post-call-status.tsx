"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

interface PostCallStatusProps {
  callId: string;
  patientEmail: string | null;
  patientEmailSentAt: string | null;
  doctorEmailSentAt: string | null;
}

export function PostCallStatus({
  callId,
  patientEmail,
  patientEmailSentAt,
  doctorEmailSentAt,
}: PostCallStatusProps) {
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState<string | null>(null);

  async function handleResend() {
    setResending(true);
    setResendResult(null);
    try {
      const res = await fetch("/api/emails/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, type: "both" }),
      });
      if (res.ok) {
        setResendResult("Emails queued for sending");
      } else {
        setResendResult("Failed to resend");
      }
    } catch {
      setResendResult("Failed to resend");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Post-Call Communications
      </h2>

      <div className="space-y-3">
        {/* Doctor Email Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Doctor Email</span>
          </div>
          {doctorEmailSentAt ? (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Sent {new Date(doctorEmailSentAt).toLocaleDateString()}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <Clock className="mr-1 h-3 w-3" />
              Not sent
            </Badge>
          )}
        </div>

        {/* Patient Email Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Patient Email</span>
            {patientEmail && (
              <span className="text-xs text-muted-foreground">({patientEmail})</span>
            )}
          </div>
          {patientEmailSentAt ? (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Sent {new Date(patientEmailSentAt).toLocaleDateString()}
            </Badge>
          ) : !patientEmail ? (
            <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
              No email on file
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <Clock className="mr-1 h-3 w-3" />
              Not sent
            </Badge>
          )}
        </div>
      </div>

      {/* Resend Button */}
      <div className="mt-4 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          Resend All
        </Button>
        {resendResult && (
          <span className="text-xs text-muted-foreground">{resendResult}</span>
        )}
      </div>
    </div>
  );
}
