"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Upload } from "lucide-react";

interface PatientRow {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  appointmentDate?: string;
  doctor?: string;
}

interface ImportResult {
  imported: number;
  skippedDuplicates: number;
  skippedInvalid: number;
}

const COLUMN_ALIASES: Record<string, keyof PatientRow> = {
  firstname: "firstName",
  first_name: "firstName",
  "first name": "firstName",
  fname: "firstName",
  lastname: "lastName",
  last_name: "lastName",
  "last name": "lastName",
  lname: "lastName",
  phone: "phone",
  phonenumber: "phone",
  phone_number: "phone",
  "phone number": "phone",
  dateofbirth: "dateOfBirth",
  date_of_birth: "dateOfBirth",
  "date of birth": "dateOfBirth",
  dob: "dateOfBirth",
  birthday: "dateOfBirth",
  appointmentdate: "appointmentDate",
  appointment_date: "appointmentDate",
  "appointment date": "appointmentDate",
  appointment: "appointmentDate",
  doctor: "doctor",
  physician: "doctor",
  provider: "doctor",
  dr: "doctor",
};

function mapColumns(headers: string[]): Record<number, keyof PatientRow> {
  const mapping: Record<number, keyof PatientRow> = {};
  headers.forEach((header, idx) => {
    const normalized = header.trim().toLowerCase().replace(/[^a-z0-9 _]/g, "");
    const field = COLUMN_ALIASES[normalized];
    if (field) mapping[idx] = field;
  });
  return mapping;
}

function parseRows(
  rawRows: string[][],
  columnMap: Record<number, keyof PatientRow>
): PatientRow[] {
  const results: PatientRow[] = [];
  for (const row of rawRows) {
    const patient: Partial<PatientRow> = {};
    row.forEach((cell, idx) => {
      const field = columnMap[idx];
      if (field && cell.trim()) {
        patient[field] = cell.trim();
      }
    });
    if (!patient.firstName && !patient.lastName) continue;
    results.push({
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      appointmentDate: patient.appointmentDate,
      doctor: patient.doctor,
    });
  }
  return results;
}

export function PatientIntakeDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Manual entry state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [doctor, setDoctor] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // CSV state
  const [parsedRows, setParsedRows] = useState<PatientRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  function resetManual() {
    setFirstName("");
    setLastName("");
    setPhone("");
    setDob("");
    setApptDate("");
    setDoctor("");
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() && !lastName.trim()) return;
    setManualError(null);
    setManualSaving(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
          dateOfBirth: dob || undefined,
          appointmentDate: apptDate || undefined,
          doctor: doctor.trim() || undefined,
        }),
      });
      if (res.ok) {
        resetManual();
        setOpen(false);
        router.refresh();
      } else {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        setManualError(err?.error ?? "Failed to add patient");
      }
    } finally {
      setManualSaving(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsedRows([]);
    setImportResult(null);

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        complete(results) {
          const data = results.data as string[][];
          if (data.length < 2) return;
          const headers = data[0];
          const columnMap = mapColumns(headers);
          const rows = parseRows(data.slice(1), columnMap);
          setParsedRows(rows);
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const ab = evt.target?.result;
        if (!ab) return;
        const wb = XLSX.read(ab, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
        if (data.length < 2) return;
        const headers = data[0].map(String);
        const columnMap = mapColumns(headers);
        const rows = parseRows(
          data.slice(1).map((r) => r.map(String)),
          columnMap
        );
        setParsedRows(rows);
      };
      reader.readAsArrayBuffer(file);
    }
  }

  async function handleImport() {
    if (parsedRows.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/patients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patients: parsedRows }),
      });
      if (res.ok) {
        const data = (await res.json()) as ImportResult;
        setImportResult(data);
        setParsedRows([]);
        router.refresh();
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Patients
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Patients</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="manual">
          <TabsList className="mb-4">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload">CSV / Excel Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="apptDate">Appointment Date</Label>
                  <Input
                    id="apptDate"
                    type="date"
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="doctor">Doctor</Label>
                <Input
                  id="doctor"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={manualSaving || (!firstName.trim() && !lastName.trim())}>
                {manualSaving ? "Saving..." : "Add Patient"}
              </Button>
              {manualError && <p className="text-sm text-red-600">{manualError}</p>}
            </form>
          </TabsContent>

          <TabsContent value="upload">
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Upload CSV or Excel file</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Columns: FirstName, LastName, Phone, DateOfBirth, AppointmentDate, Doctor
                </p>
              </div>

              {parsedRows.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Preview: {parsedRows.length} patient{parsedRows.length !== 1 ? "s" : ""} found
                  </p>
                  <div className="max-h-48 overflow-auto rounded border">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">Name</th>
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">Phone</th>
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">Appt Date</th>
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">Doctor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {parsedRows.slice(0, 10).map((row, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5">{row.firstName} {row.lastName}</td>
                            <td className="px-3 py-1.5 text-muted-foreground">{row.phone || "—"}</td>
                            <td className="px-3 py-1.5 text-muted-foreground">{row.appointmentDate || "—"}</td>
                            <td className="px-3 py-1.5 text-muted-foreground">{row.doctor || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedRows.length > 10 && (
                      <p className="px-3 py-1.5 text-xs text-muted-foreground">
                        ...and {parsedRows.length - 10} more
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleImport}
                    disabled={importing}
                    className="mt-3"
                  >
                    <Upload className="mr-1.5 h-4 w-4" />
                    {importing ? "Importing..." : `Import ${parsedRows.length} Patients`}
                  </Button>
                </div>
              )}

              {importResult !== null && (
                <div className="space-y-1 text-sm">
                  <p className="text-medical-success">
                    Imported {importResult.imported} patient
                    {importResult.imported !== 1 ? "s" : ""}.
                  </p>
                  {importResult.skippedDuplicates > 0 && (
                    <p className="text-muted-foreground">
                      Skipped {importResult.skippedDuplicates} duplicate
                      {importResult.skippedDuplicates !== 1 ? "s" : ""}.
                    </p>
                  )}
                  {importResult.skippedInvalid > 0 && (
                    <p className="text-muted-foreground">
                      Skipped {importResult.skippedInvalid} invalid row
                      {importResult.skippedInvalid !== 1 ? "s" : ""}.
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
