// src/presentation/components/PatientsManager.tsx

import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { usePatients } from "../../application/patients/usePatients";
import { useDeletePatient } from "../../application/patients/useDeletePatient";
import { useAuth } from "../../application/auth/useAuth";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { Table } from "./ui/Table";
import { PatientFormModal } from "./PatientFormModal";
import { PatientDetailModal } from "./PatientDetailModal";
import { ConfirmModal } from "./ConfirmModal";
import {
  calculerAge,
  getNomComplet,
  getSeveriteMax,
} from "../../domain/patient";
import type { Patient, AllergySeverite } from "../../domain/patient";

const SEVERITE_BADGE_VARIANT: {
  [key in AllergySeverite]: "success" | "warning" | "danger";
} = {
  LÉGÈRE: "success",
  MODÉRÉE: "warning",
  SÉVÈRE: "danger",
};

export function PatientsManager() {
  const user = useAuth((state) => state.user);
  const [search, setSearch] = useState("");

  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [modalState, setModalState] = useState<{
    open: boolean;
    patient: Patient | null;
  }>({
    open: false,
    patient: null,
  });
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    patient: Patient | null;
  }>({
    open: false,
    patient: null,
  });

  const { data: patients, isLoading } = usePatients(search || undefined);
  const { mutate: supprimer, isPending: isDeleting } = useDeletePatient();

  // SECRETAIRE peut voir la fiche mais pas modifier ni supprimer
  const peutModifier = user?.role === "ADMIN" || user?.role === "MEDECIN";
  const peutSupprimer = user?.role === "ADMIN";

  function handleDeleteConfirm() {
    if (!confirmState.patient) return;
    supprimer(confirmState.patient.id, {
      onSuccess: () => {
        toast.success(
          `Patient ${getNomComplet(confirmState.patient!)} supprimé`,
        );
        setConfirmState({ open: false, patient: null });
      },
      onError: () => {
        toast.error("Impossible de supprimer ce patient");
        setConfirmState({ open: false, patient: null });
      },
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, prénom ou email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="primary"
          onClick={() => setModalState({ open: true, patient: null })}
        >
          <Plus className="h-4 w-4" />
          Nouveau patient
        </Button>
      </div>

      {isLoading ? (
        <Spinner size={32} />
      ) : (
        <Table<Patient>
          data={patients ?? []}
          keyExtractor={(p) => p.id}
          emptyMessage="Aucun patient trouvé"
          columns={[
            { header: "Nom", accessor: (p) => getNomComplet(p) },
            { header: "Âge", accessor: (p) => calculerAge(p.dateNaissance) },
            { header: "Email", accessor: (p) => p.email },
            { header: "Téléphone", accessor: (p) => p.telephone ?? "—" },
            {
              header: "Allergies",
              accessor: (p) => {
                const max = getSeveriteMax(p.allergies);
                if (!max) return <span className="text-gray-400">Aucune</span>;
                return (
                  <Badge variant={SEVERITE_BADGE_VARIANT[max]}>{max}</Badge>
                );
              },
            },
            {
              header: "Actions",
              accessor: (p) => (
                <div className="flex gap-2">
                  {/* Voir la fiche — tous les rôles */}
                  <button
                    onClick={() => setDetailPatient(p)}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                    aria-label="Voir la fiche"
                    title="Voir la fiche patient"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {/* Modifier — admin et médecin uniquement */}
                  {peutModifier && (
                    <button
                      onClick={() => setModalState({ open: true, patient: p })}
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                      aria-label="Modifier"
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}

                  {/* Supprimer — admin uniquement */}
                  {peutSupprimer && (
                    <button
                      onClick={() =>
                        setConfirmState({ open: true, patient: p })
                      }
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-danger-600"
                      aria-label="Supprimer"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Fiche détail — tous les rôles, bouton Modifier conditionnel */}
      <PatientDetailModal
        patient={detailPatient}
        onClose={() => setDetailPatient(null)}
        onEdit={
          peutModifier
            ? (p) => {
                setDetailPatient(null);
                setModalState({ open: true, patient: p });
              }
            : undefined
        }
      />

      <PatientFormModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, patient: null })}
        patient={modalState.patient}
      />

      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirmState({ open: false, patient: null })}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le patient"
        message={
          confirmState.patient
            ? `Voulez-vous vraiment supprimer le patient ${getNomComplet(confirmState.patient)} ? Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer"
        isLoading={isDeleting}
      />
    </div>
  );
}
