"use client";

import { useState, useEffect } from "react";

interface Patient {
  id: string;
  name: string;
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
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
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
        <span className="text-sm text-gray-700">
          Patient: <strong>{currentPatientName}</strong>
        </span>
      )}

      {!showNew ? (
        <>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">
              {currentPatientName ? "Reassign..." : "Assign patient..."}
            </option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {selectedId && (
            <button
              onClick={() => assignPatient(selectedId)}
              disabled={saving}
              className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Assign"}
            </button>
          )}
          <button
            onClick={() => setShowNew(true)}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
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
            placeholder="Patient name"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <button
            onClick={createAndAssign}
            disabled={saving || !newName.trim()}
            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create & Assign"}
          </button>
          <button
            onClick={() => setShowNew(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}
