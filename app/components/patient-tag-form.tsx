"use client";

import { useState, useEffect } from "react";

interface Patient {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
}

function displayName(p: Patient) {
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || p.name;
}

export function PatientTagForm({
  callId,
  currentPatientId,
  currentPatientName,
}: {
  callId: string;
  currentPatientId: string | null;
  currentPatientName: string | null;
}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState(currentPatientId ?? "");
  const [newName, setNewName] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then((data) => setPatients(data))
      .catch(() => {});
  }, []);

  async function assignPatient(patientId: string) {
    setSaving(true);
    try {
      await fetch(`/api/calls/${callId}/patient`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  async function createAndAssign() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const trimmed = newName.trim();
      const spaceIdx = trimmed.indexOf(" ");
      const firstName = spaceIdx > 0 ? trimmed.slice(0, spaceIdx) : trimmed;
      const lastName = spaceIdx > 0 ? trimmed.slice(spaceIdx + 1) : "";

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });
      const patient = await res.json();
      await assignPatient(patient.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {currentPatientName && (
        <span className="text-sm text-foreground">
          Patient: <strong>{currentPatientName}</strong>
        </span>
      )}

      {!showNew ? (
        <>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-sm"
          >
            <option value="">
              {currentPatientName ? "Reassign..." : "Assign patient..."}
            </option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {displayName(p)}
              </option>
            ))}
          </select>
          {selectedId && (
            <button
              onClick={() => assignPatient(selectedId)}
              disabled={saving}
              className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Assign"}
            </button>
          )}
          <button
            onClick={() => setShowNew(true)}
            className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            + New
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="First Last"
            className="rounded border border-border bg-background px-2 py-1 text-sm"
          />
          <button
            onClick={createAndAssign}
            disabled={saving || !newName.trim()}
            className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create & Assign"}
          </button>
          <button
            onClick={() => setShowNew(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}
