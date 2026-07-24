// src/presentation/components/PrescriptionsManager.tsx

import { useState } from "react";
import { Plus, Download, Ban, Search } from "lucide-react";
import toast from "react-hot-toast";
import { usePrescriptions } from "../../application/prescriptions/usePrescriptions";
import { useCancelPrescription } from "../../application/prescriptions/useCancelPrescription";
import { useDownloadPrescriptionPdf } from "../../application/prescriptions/useDownloadPrescriptionPdf";
import { usePatients } from "../../application/patients/usePatients";
import { useAuth } from "../../application/auth/useAuth";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { Table } from "./ui/Table";
import { PrescriptionFormModal } from "./PrescriptionFormModal";
import { ConfirmModal } from "./ConfirmModal";
import { peutAnnulerPrescription, estExpiree } from "../../domain/prescription";
import { getNomComplet } from "../../domain/patient";
import type {
  Prescription,
  PrescriptionStatus,
} from "../../domain/prescription";

const STATUS_LABELS: Record<PrescriptionStatus, string> = {
  ACTIVE: "Active",
  EXPIREE: "Expirée",
  ANNULEE: "Annulée",
};

const STATUS_BADGE_VARIANT: {
  [key in PrescriptionStatus]: "success" | "neutral" | "danger";
} = {
  ACTIVE: "success",
  EXPIREE: "neutral",
  ANNULEE: "danger",
};

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIREE", label: "Expirée" },
  { value: "ANNULEE", label: "Annulée" },
];

function getStatutAffiche(p: Prescription): PrescriptionStatus {
  if (p.status === "ANNULEE") return "ANNULEE";
  return estExpiree(p) ? "EXPIREE" : "ACTIVE";
}

export function PrescriptionsManager() {
  const user = useAuth((state) => state.user);
  const isMedecin = user?.role === "MEDECIN";

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmPrescription, setConfirmPrescription] =
    useState<Prescription | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const { data: patients } = usePatients();
  const { data: prescriptions, isLoading } = usePrescriptions(
    isMedecin
      ? { medecinId: user?.id }
      : { patientId: selectedPatientId || undefined },
  );
  const { mutate: annuler, isPending: isCancelling } = useCancelPrescription();
  const { mutate: telecharger } = useDownloadPrescriptionPdf();

  const patientOptions = (patients ?? []).map((p) => ({
    value: p.id,
    label: getNomComplet(p),
  }));

  const patientNom = (id: string) => {
    const patient = patients?.find((p) => p.id === id);
    return patient ? getNomComplet(patient) : "Patient supprimé";
  };

  const filteredPrescriptions = (prescriptions ?? []).filter((p) => {
    if (!statusFilter) return true;
    return getStatutAffiche(p) === statusFilter;
  });

  function handleAnnulerConfirm() {
    if (!confirmPrescription) return;
    annuler(confirmPrescription.id, {
      onSuccess: () => {
        toast.success("Prescription annulée");
        setConfirmPrescription(null);
      },
      onError: () => {
        toast.error("Impossible d'annuler cette prescription");
        setConfirmPrescription(null);
      },
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {!isMedecin && (
            <div className="w-64">
              <Select
                options={patientOptions}
                placeholder="Sélectionner un patient"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              />
            </div>
          )}
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
        </div>
        <Button variant="primary" onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle prescription
        </Button>
      </div>

      {!isMedecin && !selectedPatientId ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <Search className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500">
            Sélectionne un patient ci-dessus pour voir ses prescriptions.
          </p>
        </div>
      ) : isLoading ? (
        <Spinner size={32} />
      ) : (
        <Table<Prescription>
          data={filteredPrescriptions}
          keyExtractor={(p) => p.id}
          emptyMessage="Aucune prescription"
          columns={[
            ...(isMedecin
              ? [
                  {
                    header: "Patient",
                    accessor: (p: Prescription) => patientNom(p.patientId),
                  },
                ]
              : []),
            {
              header: "Date",
              accessor: (p) =>
                new Date(p.datePrescription).toLocaleDateString("fr-FR"),
            },
            {
              header: "Expiration",
              accessor: (p) =>
                new Date(p.dateExpiration).toLocaleDateString("fr-FR"),
            },
            { header: "Diagnostic", accessor: (p) => p.diagnostic ?? "—" },
            {
              header: "Médicaments",
              accessor: (p) =>
                p.medicaments.map((m) => m.medicament).join(", "),
            },
            {
              header: "Statut",
              accessor: (p) => {
                const statut = getStatutAffiche(p);
                return (
                  <Badge variant={STATUS_BADGE_VARIANT[statut]}>
                    {STATUS_LABELS[statut]}
                  </Badge>
                );
              },
            },
            {
              header: "Actions",
              accessor: (p) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => telecharger(p.id)}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                    aria-label="Télécharger le PDF"
                    title="Télécharger le PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {peutAnnulerPrescription(p) && (
                    <button
                      onClick={() => setConfirmPrescription(p)}
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-danger-600"
                      aria-label="Annuler"
                      title="Annuler"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      <PrescriptionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        patientIdPreselectionne={
          !isMedecin ? selectedPatientId || undefined : undefined
        }
      />

      <ConfirmModal
        isOpen={confirmPrescription !== null}
        onClose={() => setConfirmPrescription(null)}
        onConfirm={handleAnnulerConfirm}
        title="Annuler la prescription"
        message="Voulez-vous vraiment annuler cette prescription ? Cette action est irréversible."
        confirmLabel="Annuler la prescription"
        isLoading={isCancelling}
      />
    </div>
  );
}
