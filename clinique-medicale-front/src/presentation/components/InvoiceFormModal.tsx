// src/presentation/components/InvoiceFormModal.tsx

import { useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { useCreateInvoice } from "../../application/billing/useCreateInvoice";
import { usePatients } from "../../application/patients/usePatients";
import { useAppointments } from "../../application/appointments/useAppointments";
import { getErrorMessage } from "../../infrastructure/apiClient";
import { calculerLigneTotal, calculerTotalLignes } from "../../domain/billing";
import { getNomComplet } from "../../domain/patient";

const invoiceLineSchema = z.object({
  description: z.string().min(1, "Description requise"),
  quantite: z.number().min(1, "Quantité minimum 1"),
  prixUnitaire: z.number().min(0, "Prix invalide"),
});

const invoiceFormSchema = z
  .object({
    patientId: z.string().min(1, "Patient requis"),
    appointmentId: z.string().optional(),
    dateFacture: z.string().min(1, "Date de facture requise"),
    dateEcheance: z.string().optional(),
    lignes: z.array(invoiceLineSchema).min(1, "Au moins une ligne requise"),
    notes: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.dateFacture ||
      !data.dateEcheance ||
      new Date(data.dateEcheance) >= new Date(data.dateFacture),
    {
      message:
        "La date d'échéance ne peut pas être antérieure à la date de facture",
      path: ["dateEcheance"],
    },
  );

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

const EMPTY_DEFAULTS: InvoiceFormValues = {
  patientId: "",
  appointmentId: "",
  dateFacture: "",
  dateEcheance: "",
  lignes: [{ description: "", quantite: 1, prixUnitaire: 0 }],
  notes: "",
};

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceFormModal({ isOpen, onClose }: InvoiceFormModalProps) {
  const { data: patients } = usePatients();
  const { data: appointments } = useAppointments();
  const { mutate: creer, isPending } = useCreateInvoice();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lignes" });
  const patientId = useWatch({ control, name: "patientId" });
  const lignes = useWatch({ control, name: "lignes" });
  const dateFactureValue = useWatch({ control, name: "dateFacture" });

  useEffect(() => {
    if (isOpen) reset(EMPTY_DEFAULTS);
  }, [isOpen, reset]);

  const patientOptions = (patients ?? []).map((p) => ({
    value: p.id,
    label: getNomComplet(p),
  }));
  const appointmentOptions = (appointments ?? [])
    .filter((a) => a.patientId === patientId)
    .map((a) => ({
      value: a.id,
      label: new Date(a.debut).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    }));

  const totalEstime = calculerTotalLignes(lignes ?? []);

  function onSubmit(values: InvoiceFormValues) {
    creer(
      {
        patientId: values.patientId,
        appointmentId: values.appointmentId || undefined,
        dateFacture: values.dateFacture,
        dateEcheance: values.dateEcheance || undefined,
        lignes: values.lignes,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Facture créée avec succès");
          reset(EMPTY_DEFAULTS);
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle facture"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Patient"
          required
          options={patientOptions}
          placeholder="Sélectionner un patient"
          error={errors.patientId?.message}
          {...register("patientId")}
        />
        <Select
          label="Rendez-vous associé (optionnel)"
          options={appointmentOptions}
          placeholder="Aucun rendez-vous associé"
          {...register("appointmentId")}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date de facture"
            type="date"
            required
            error={errors.dateFacture?.message}
            {...register("dateFacture")}
          />
          <Input
            label="Date d'échéance"
            type="date"
            min={dateFactureValue || undefined}
            error={errors.dateEcheance?.message}
            {...register("dateEcheance")}
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Lignes de facturation
            </h3>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                append({ description: "", quantite: 1, prixUnitaire: 0 })
              }
            >
              <Plus className="h-4 w-4" />
              Ajouter une ligne
            </Button>
          </div>
          {errors.lignes?.message && (
            <p className="mb-2 text-sm text-danger-600">
              {errors.lignes.message}
            </p>
          )}
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-end gap-3 rounded-md border border-gray-200 p-3"
              >
                <Input
                  label="Description"
                  required
                  placeholder="Ex : Consultation générale"
                  error={errors.lignes?.[index]?.description?.message}
                  {...register(`lignes.${index}.description`)}
                />
                <Input
                  label="Quantité"
                  type="number"
                  min={1}
                  required
                  error={errors.lignes?.[index]?.quantite?.message}
                  {...register(`lignes.${index}.quantite`, {
                    valueAsNumber: true,
                  })}
                />
                <Input
                  label="Prix unitaire"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  placeholder="0"
                  error={errors.lignes?.[index]?.prixUnitaire?.message}
                  {...register(`lignes.${index}.prixUnitaire`, {
                    valueAsNumber: true,
                  })}
                />
                <div>
                  <p className="mb-1 block text-sm font-medium text-gray-700">
                    Total
                  </p>
                  <p className="px-3 py-2 text-sm text-gray-900">
                    {calculerLigneTotal(
                      lignes?.[index] ?? { quantite: 0, prixUnitaire: 0 },
                    ).toLocaleString("fr-FR")}{" "}
                    FCFA
                  </p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-right text-sm font-semibold text-gray-900">
            Total estimé : {totalEstime.toLocaleString("fr-FR")} FCFA
          </p>
        </div>

        <Input
          label="Notes"
          placeholder="Ex : Paiement par virement, règlement partiel accepté"
          {...register("notes")}
        />

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            Créer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
