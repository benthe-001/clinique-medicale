// src/presentation/components/BillingManager.tsx

import { useState } from "react";
import { Plus, Search, CreditCard, Download, Ban } from "lucide-react";
import toast from "react-hot-toast";
import { useInvoices } from "../../application/billing/useInvoices";
import { useCancelInvoice } from "../../application/billing/useCancelInvoice";
import { useDownloadInvoicePdf } from "../../application/billing/useDownloadInvoicePdf";
import { usePatients } from "../../application/patients/usePatients";
import { useAuth } from "../../application/auth/useAuth";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { Table } from "./ui/Table";
import { InvoiceFormModal } from "./InvoiceFormModal";
import { PaymentModal } from "./PaymentModal";
import { ConfirmModal } from "./ConfirmModal";
import { peutEnregistrerPaiement, peutAnnuler } from "../../domain/billing";
import { getNomComplet as getNomCompletPatient } from "../../domain/patient";
import type { Invoice, InvoiceStatus } from "../../domain/billing";

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  EN_ATTENTE: "En attente",
  PARTIELLEMENT_PAYEE: "Part. payée",
  PAYEE: "Payée",
  ANNULEE: "Annulée",
};

const STATUS_BADGE_VARIANT: Record<
  InvoiceStatus,
  "primary" | "success" | "warning" | "danger"
> = {
  EN_ATTENTE: "warning",
  PARTIELLEMENT_PAYEE: "primary",
  PAYEE: "success",
  ANNULEE: "danger",
};

export function BillingManager() {
  const user = useAuth((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [confirmInvoice, setConfirmInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const { data: invoices, isLoading } = useInvoices();
  const { data: patients } = usePatients();
  const { mutate: annuler, isPending: isCancelling } = useCancelInvoice();
  const { mutate: telecharger } = useDownloadInvoicePdf();

  const patientNom = (id: string) => {
    const patient = patients?.find((p) => p.id === id);
    return patient ? getNomCompletPatient(patient) : "Patient supprimé";
  };

  const filteredInvoices = (invoices ?? []).filter((i) =>
    statusFilter ? i.status === statusFilter : true,
  );

  function handleAnnulerConfirm() {
    if (!confirmInvoice) return;
    annuler(confirmInvoice.id, {
      onSuccess: () => {
        toast.success("Facture annulée");
        setConfirmInvoice(null);
      },
      onError: () => {
        toast.error("Impossible d'annuler cette facture");
        setConfirmInvoice(null);
      },
    });
  }

  const STATUS_OPTIONS = [
    { value: "", label: "Tous les statuts" },
    { value: "EN_ATTENTE", label: "En attente" },
    { value: "PARTIELLEMENT_PAYEE", label: "Partiellement payée" },
    { value: "PAYEE", label: "Payée" },
    { value: "ANNULEE", label: "Annulée" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
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
          Nouvelle facture
        </Button>
      </div>

      {isLoading ? (
        <Spinner size={32} />
      ) : (
        <Table<Invoice>
          data={filteredInvoices}
          keyExtractor={(i) => i.id}
          emptyMessage="Aucune facture"
          columns={[
            { header: "Patient", accessor: (i) => patientNom(i.patientId) },
            {
              header: "Date",
              accessor: (i) =>
                new Date(i.dateFacture).toLocaleDateString("fr-FR"),
            },
            {
              header: "Total",
              accessor: (i) => `${i.montantTotal.toLocaleString("fr-FR")} FCFA`,
            },
            {
              header: "Payé",
              accessor: (i) => `${i.montantPaye.toLocaleString("fr-FR")} FCFA`,
            },
            {
              header: "Reste",
              accessor: (i) =>
                `${i.montantRestant.toLocaleString("fr-FR")} FCFA`,
            },
            {
              header: "Statut",
              accessor: (i) => (
                <Badge variant={STATUS_BADGE_VARIANT[i.status]}>
                  {STATUS_LABELS[i.status]}
                </Badge>
              ),
            },
            {
              header: "Actions",
              accessor: (i) => (
                <div className="flex gap-2">
                  {peutEnregistrerPaiement(i) && (
                    <button
                      onClick={() => setPaymentInvoice(i)}
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-success-600"
                      aria-label="Enregistrer un paiement"
                      title="Enregistrer un paiement"
                    >
                      <CreditCard className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => telecharger(i.id)}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                    aria-label="Télécharger le PDF"
                    title="Télécharger le PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {isAdmin && peutAnnuler(i) && (
                    <button
                      onClick={() => setConfirmInvoice(i)}
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-danger-600"
                      aria-label="Annuler la facture"
                      title="Annuler la facture"
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

      <InvoiceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
      <PaymentModal
        isOpen={paymentInvoice !== null}
        onClose={() => setPaymentInvoice(null)}
        invoice={paymentInvoice}
      />
      <ConfirmModal
        isOpen={confirmInvoice !== null}
        onClose={() => setConfirmInvoice(null)}
        onConfirm={handleAnnulerConfirm}
        title="Annuler la facture"
        message="Voulez-vous vraiment annuler cette facture ? Cette action est irréversible."
        confirmLabel="Annuler la facture"
        isLoading={isCancelling}
      />
    </div>
  );
}
