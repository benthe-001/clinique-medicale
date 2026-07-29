// src/presentation/components/PrescriptionFormModal.tsx

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
import { useCreatePrescription } from "../../application/prescriptions/useCreatePrescription";
import { usePatients } from "../../application/patients/usePatients";
import { useMedecins } from "../../application/users/useMedecins";
import { useAppointments } from "../../application/appointments/useAppointments";
import { useAuth } from "../../application/auth/useAuth";
import { getErrorMessage } from "../../infrastructure/apiClient";
import { getNomComplet as getNomCompletPatient } from "../../domain/patient";
import { getNomComplet as getNomCompletUser } from "../../domain/user";

const drugLineSchema = z.object({
  medicament: z.string().min(1, "Médicament requis"),
  dosage: z
    .string()
    .min(1, "Dosage requis")
    .regex(
      /^\d+(\.\d+)?\s*(mg|g|ml|mcg|µg|UI|comprimé|comprimés|gélule|gélules|goutte|gouttes)$/i,
      'Format attendu : ex. "500mg"',
    ),
  frequence: z.string().min(1, "Fréquence requise"),
  duree: z
    .string()
    .min(1, "Durée requise")
    .regex(
      /^\d+\s*(jour|jours|semaine|semaines|mois)$/i,
      'Format attendu : ex. "7 jours"',
    ),
  instructions: z.string().optional(),
});

const prescriptionFormSchema = z
  .object({
    patientId: z.string().min(1, "Patient requis"),
    medecinId: z.string().min(1, "Médecin requis"),
    appointmentId: z.string().optional(),
    datePrescription: z.string().min(1, "Date de prescription requise"),
    dateExpiration: z.string().min(1, "Date d'expiration requise"),
    diagnostic: z.string().optional(),
    notes: z.string().optional(),
    medicaments: z
      .array(drugLineSchema)
      .min(1, "Au moins un médicament requis"),
  })
  .refine(
    (data) =>
      !data.datePrescription ||
      !data.dateExpiration ||
      new Date(data.dateExpiration) > new Date(data.datePrescription),
    {
      message: "La date d'expiration doit être après la date de prescription",
      path: ["dateExpiration"],
    },
  );

type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

const EMPTY_DRUG = {
  medicament: "",
  dosage: "",
  frequence: "",
  duree: "",
  instructions: "",
};

function defaultValues(
  patientIdPreselectionne: string,
  medecinId: string,
): PrescriptionFormValues {
  return {
    patientId: patientIdPreselectionne,
    medecinId,
    appointmentId: "",
    datePrescription: "",
    dateExpiration: "",
    diagnostic: "",
    notes: "",
    medicaments: [{ ...EMPTY_DRUG }],
  };
}

interface PrescriptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientIdPreselectionne?: string;
}

export function PrescriptionFormModal({
  isOpen,
  onClose,
  patientIdPreselectionne,
}: PrescriptionFormModalProps) {
  const currentUser = useAuth((state) => state.user);
  const isMedecin = currentUser?.role === "MEDECIN";
  const medecinId = isMedecin && currentUser ? currentUser.id : "";

  const { data: patients } = usePatients();
  const { data: medecins } = useMedecins();
  const { data: appointments } = useAppointments();
  const { mutate: creer, isPending } = useCreatePrescription();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: defaultValues(patientIdPreselectionne ?? "", medecinId),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medicaments",
  });
  const patientId = useWatch({ control, name: "patientId" });
  const datePrescriptionValue = useWatch({ control, name: "datePrescription" });

  useEffect(() => {
    if (isOpen) reset(defaultValues(patientIdPreselectionne ?? "", medecinId));
  }, [isOpen, patientIdPreselectionne, medecinId, reset]);

  const patientOptions = (patients ?? []).map((p) => ({
    value: p.id,
    label: getNomCompletPatient(p),
  }));
  const medecinOptions = (medecins ?? []).map((m) => ({
    value: m.id,
    label: getNomCompletUser(m),
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

  function onSubmit(values: PrescriptionFormValues) {
    creer(
      {
        patientId: values.patientId,
        medecinId: values.medecinId,
        appointmentId: values.appointmentId || undefined,
        datePrescription: values.datePrescription,
        dateExpiration: values.dateExpiration,
        medicaments: values.medicaments.map((m) => ({
          ...m,
          instructions: m.instructions ?? "",
        })),
        diagnostic: values.diagnostic || undefined,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Prescription créée avec succès");
          reset(defaultValues(patientIdPreselectionne ?? "", medecinId));
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
      title="Nouvelle prescription"
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
          label="Médecin"
          required
          options={medecinOptions}
          placeholder="Sélectionner un médecin"
          error={errors.medecinId?.message}
          disabled={isMedecin}
          {...register("medecinId")}
        />
        <Select
          label="Rendez-vous associé (optionnel)"
          options={appointmentOptions}
          placeholder="Aucun rendez-vous associé"
          {...register("appointmentId")}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date de prescription"
            type="date"
            required
            error={errors.datePrescription?.message}
            {...register("datePrescription")}
          />
          <Input
            label="Date d'expiration"
            type="date"
            required
            min={datePrescriptionValue || undefined}
            error={errors.dateExpiration?.message}
            {...register("dateExpiration")}
          />
        </div>
        <Input
          label="Diagnostic"
          placeholder="Ex : Grippe saisonnière, infection urinaire"
          {...register("diagnostic")}
        />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Médicaments</h3>
            <Button
              type="button"
              variant="ghost"
              onClick={() => append({ ...EMPTY_DRUG })}
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
          {errors.medicaments?.message && (
            <p className="mb-2 text-sm text-danger-600">
              {errors.medicaments.message}
            </p>
          )}
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-3 rounded-md border border-gray-200 p-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Médicament"
                    required
                    placeholder="Ex : Paracétamol"
                    error={errors.medicaments?.[index]?.medicament?.message}
                    {...register(`medicaments.${index}.medicament`)}
                  />
                  <Input
                    label="Dosage"
                    required
                    placeholder="Ex : 500mg"
                    error={errors.medicaments?.[index]?.dosage?.message}
                    {...register(`medicaments.${index}.dosage`)}
                  />
                  <Input
                    label="Fréquence"
                    required
                    placeholder="Ex : 3 fois par jour"
                    error={errors.medicaments?.[index]?.frequence?.message}
                    {...register(`medicaments.${index}.frequence`)}
                  />
                  <Input
                    label="Durée"
                    required
                    placeholder="Ex : 7 jours"
                    error={errors.medicaments?.[index]?.duree?.message}
                    {...register(`medicaments.${index}.duree`)}
                  />
                </div>
                <Input
                  label="Instructions"
                  placeholder="Ex : À prendre après les repas"
                  {...register(`medicaments.${index}.instructions`)}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Input
          label="Notes"
          placeholder="Ex : Renouvellement possible sur présentation de l'ordonnance"
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
