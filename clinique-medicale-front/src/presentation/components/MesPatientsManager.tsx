// src/presentation/components/MesPatientsManager.tsx

import { useMemo, useState } from "react";
import { Phone, Mail, Calendar, Eye, Search } from "lucide-react";
import { useAuth } from "../../application/auth/useAuth";
import { usePatients } from "../../application/patients/usePatients";
import { useAppointments } from "../../application/appointments/useAppointments";
import { Spinner } from "./ui/Spinner";
import { Table } from "./ui/Table";
import { Input } from "./ui/Input";
import { PatientDetailModal } from "./PatientDetailModal";
import { PatientFormModal } from "./PatientFormModal";
import { calculerAge, getNomComplet } from "../../domain/patient";
import type { Patient } from "../../domain/patient";

export function MesPatientsManager() {
  const user = useAuth((state) => state.user);
  const { data: patients, isLoading: isLoadingPatients } = usePatients();
  const { data: appointments, isLoading: isLoadingAppointments } =
    useAppointments(user?.id);

  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);

  const isLoading = isLoadingPatients || isLoadingAppointments;

  const mesPatients = useMemo(() => {
    if (!patients || !appointments) return [];
    const idsVus = new Set(appointments.map((a) => a.patientId));
    return patients.filter((p) => idsVus.has(p.id));
  }, [patients, appointments]);

  const patientsFiltres = useMemo(() => {
    if (!search.trim()) return mesPatients;
    const q = search.toLowerCase();
    return mesPatients.filter(
      (p) =>
        p.nom.toLowerCase().includes(q) ||
        p.prenom.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.telephone ?? "").includes(q),
    );
  }, [mesPatients, search]);

  const nombreRdv = (patientId: string) =>
    (appointments ?? []).filter((a) => a.patientId === patientId).length;

  if (isLoading) return <Spinner size={32} />;

  return (
    <div>
      <div className="mb-4 relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Rechercher par nom, prénom ou email..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table<Patient>
        data={patientsFiltres}
        keyExtractor={(p) => p.id}
        emptyMessage="Aucun patient trouvé"
        columns={[
          { header: "Nom", accessor: (p) => getNomComplet(p) },
          {
            header: "Âge",
            accessor: (p) => `${calculerAge(p.dateNaissance)} ans`,
          },
          {
            header: "Téléphone",
            accessor: (p) =>
              p.telephone ? (
                <span className="flex items-center gap-1.5 text-gray-600">
                  <Phone className="h-3.5 w-3.5" />
                  {p.telephone}
                </span>
              ) : (
                "—"
              ),
          },
          {
            header: "Email",
            accessor: (p) => (
              <span className="flex items-center gap-1.5 text-gray-600">
                <Mail className="h-3.5 w-3.5" />
                {p.email}
              </span>
            ),
          },
          {
            header: "Consultations",
            accessor: (p) => (
              <span className="flex items-center gap-1.5 text-gray-600">
                <Calendar className="h-3.5 w-3.5" />
                {nombreRdv(p.id)}
              </span>
            ),
          },
          {
            header: "Dossier",
            accessor: (p) => (
              <button
                onClick={() => setSelectedPatient(p)}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                aria-label="Voir le dossier"
                title="Voir le dossier médical"
              >
                <Eye className="h-4 w-4" />
              </button>
            ),
          },
        ]}
      />

      <PatientDetailModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
        onEdit={(p) => {
          setSelectedPatient(null);
          setEditPatient(p);
        }}
      />

      <PatientFormModal
        isOpen={editPatient !== null}
        onClose={() => setEditPatient(null)}
        patient={editPatient}
      />
    </div>
  );
}
