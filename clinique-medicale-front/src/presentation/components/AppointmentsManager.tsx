// src/presentation/components/AppointmentsManager.tsx

import { useState } from "react";
import { Plus, Check, X, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useAppointments } from "../../application/appointments/useAppointments";
import { useUpdateAppointment } from "../../application/appointments/useUpdateAppointment";
import { useCancelAppointment } from "../../application/appointments/useCancelAppointment";
import { usePatients } from "../../application/patients/usePatients";
import { useMedecins } from "../../application/users/useMedecins";
import { useAuth } from "../../application/auth/useAuth";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { Table } from "./ui/Table";
import { AppointmentFormModal } from "./AppointmentFormModal";
import { ConfirmModal } from "./ConfirmModal";
import { estAnnulable } from "../../domain/appointment";
import { getNomComplet as getNomCompletPatient } from "../../domain/patient";
import { getNomComplet as getNomCompletUser } from "../../domain/user";
import type { Appointment, AppointmentStatus } from "../../domain/appointment";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PLANIFIE: "Planifié",
  CONFIRME: "Confirmé",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

const STATUS_BADGE_VARIANT: {
  [key in AppointmentStatus]: "primary" | "success" | "neutral" | "danger";
} = {
  PLANIFIE: "primary",
  CONFIRME: "success",
  TERMINE: "neutral",
  ANNULE: "danger",
};

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "PLANIFIE", label: "Planifié" },
  { value: "CONFIRME", label: "Confirmé" },
  { value: "TERMINE", label: "Terminé" },
  { value: "ANNULE", label: "Annulé" },
];

function formatDateHeure(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AppointmentsManager() {
  const user = useAuth((state) => state.user);
  const isMedecin = user?.role === "MEDECIN";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmAppointment, setConfirmAppointment] =
    useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const { data: appointments, isLoading } = useAppointments(
    isMedecin ? user?.id : undefined,
  );
  const { data: patients } = usePatients();
  const { data: medecins } = useMedecins();
  const { mutate: updateStatus } = useUpdateAppointment();
  const { mutate: annuler, isPending: isCancelling } = useCancelAppointment();

  const patientNom = (id: string) => {
    const patient = patients?.find((p) => p.id === id);
    return patient ? getNomCompletPatient(patient) : "Patient supprimé";
  };

  const medecinNom = (id: string) => {
    const medecin = medecins?.find((m) => m.id === id);
    return medecin ? getNomCompletUser(medecin) : id;
  };

  const filteredAppointments = (appointments ?? []).filter((a) =>
    statusFilter ? a.status === statusFilter : true,
  );

  function handleAnnulerClick(appointment: Appointment) {
    if (!estAnnulable(appointment)) {
      toast.error(
        "Annulation impossible : moins de 24h avant le début ou statut déjà final.",
      );
      return;
    }
    setConfirmAppointment(appointment);
  }

  function handleAnnulerConfirm() {
    if (!confirmAppointment) return;
    annuler(confirmAppointment.id, {
      onSuccess: () => {
        toast.success("Rendez-vous annulé");
        setConfirmAppointment(null);
      },
      onError: () => {
        toast.error("Impossible d'annuler ce rendez-vous");
        setConfirmAppointment(null);
      },
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouveau rendez-vous
        </Button>
      </div>

      {isLoading ? (
        <Spinner size={32} />
      ) : (
        <Table<Appointment>
          data={filteredAppointments}
          keyExtractor={(a) => a.id}
          emptyMessage="Aucun rendez-vous"
          columns={[
            { header: "Patient", accessor: (a) => patientNom(a.patientId) },
            { header: "Médecin", accessor: (a) => medecinNom(a.medecinId) },
            { header: "Début", accessor: (a) => formatDateHeure(a.debut) },
            { header: "Motif", accessor: (a) => a.motif ?? "—" },
            { header: "Salle", accessor: (a) => a.salle ?? "—" },
            {
              header: "Statut",
              accessor: (a) => (
                <Badge variant={STATUS_BADGE_VARIANT[a.status]}>
                  {STATUS_LABELS[a.status]}
                </Badge>
              ),
            },
            {
              header: "Actions",
              accessor: (a) => (
                <div className="flex gap-2">
                  {a.status === "PLANIFIE" && (
                    <button
                      onClick={() =>
                        updateStatus(
                          { id: a.id, action: "confirmer" },
                          {
                            onSuccess: () =>
                              toast.success("Rendez-vous confirmé"),
                            onError: () =>
                              toast.error(
                                "Impossible de confirmer ce rendez-vous",
                              ),
                          },
                        )
                      }
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-success-600"
                      aria-label="Confirmer"
                      title="Confirmer"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {(a.status === "PLANIFIE" || a.status === "CONFIRME") && (
                    <button
                      onClick={() =>
                        updateStatus(
                          { id: a.id, action: "terminer" },
                          {
                            onSuccess: () =>
                              toast.success("Rendez-vous terminé"),
                            onError: () =>
                              toast.error(
                                "Impossible de terminer ce rendez-vous",
                              ),
                          },
                        )
                      }
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                      aria-label="Terminer"
                      title="Marquer comme terminé"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  {(a.status === "PLANIFIE" || a.status === "CONFIRME") && (
                    <button
                      onClick={() => handleAnnulerClick(a)}
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-danger-600"
                      aria-label="Annuler"
                      title="Annuler"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      <AppointmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <ConfirmModal
        isOpen={confirmAppointment !== null}
        onClose={() => setConfirmAppointment(null)}
        onConfirm={handleAnnulerConfirm}
        title="Annuler le rendez-vous"
        message="Voulez-vous vraiment annuler ce rendez-vous ? Cette action est irréversible."
        confirmLabel="Annuler le rendez-vous"
        isLoading={isCancelling}
      />
    </div>
  );
}
