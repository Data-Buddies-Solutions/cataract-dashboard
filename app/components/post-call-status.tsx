"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Video,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";

interface PostCallStatusProps {
  callId: string;
  patientEmail: string | null;
  patientEmailSentAt: string | null;
  doctorEmailSentAt: string | null;
  videoStatus: string | null;
  videoUrl: string | null;
}

export function PostCallStatus({
  callId,
  patientEmail,
  patientEmailSentAt,
  doctorEmailSentAt,
  videoStatus,
  videoUrl,
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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
        Post-Call Communications
      </h2>

      <div className="space-y-3">
        {/* Doctor Email Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">Doctor Email</span>
          </div>
          {doctorEmailSentAt ? (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-green-700"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Sent {new Date(doctorEmailSentAt).toLocaleDateString()}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500">
              <Clock className="mr-1 h-3 w-3" />
              Not sent
            </Badge>
          )}
        </div>

        {/* Patient Email Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">Patient Email</span>
            {patientEmail && (
              <span className="text-xs text-gray-400">({patientEmail})</span>
            )}
          </div>
          {patientEmailSentAt ? (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-green-700"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Sent {new Date(patientEmailSentAt).toLocaleDateString()}
            </Badge>
          ) : !patientEmail ? (
            <Badge variant="outline" className="text-amber-600">
              No email on file
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500">
              <Clock className="mr-1 h-3 w-3" />
              Not sent
            </Badge>
          )}
        </div>

        {/* Video Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">Educational Video</span>
          </div>
          {videoStatus === "ready" && videoUrl ? (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
            >
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              View Video
            </a>
          ) : videoStatus === "generating" ? (
            <Badge variant="outline" className="text-blue-600">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Generating...
            </Badge>
          ) : videoStatus === "failed" ? (
            <Badge
              variant="outline"
              className="border-red-200 bg-red-50 text-red-600"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Failed
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500">
              <Clock className="mr-1 h-3 w-3" />
              Pending
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
          <span className="text-xs text-gray-500">{resendResult}</span>
        )}
      </div>
    </div>
  );
}
