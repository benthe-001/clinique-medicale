// src/presentation/components/PatientFormModal.tsx

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { useCreatePatient } from "../../application/patients/useCreatePatient";
import { useUpdatePatient } from "../../application/patients/useUpdatePatient";
import { getErrorMessage } from "../../infrastructure/apiClient";
import type { Patient } from "../../domain/patient";

const allergySchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  severite: z.enum(["LÉGÈRE", "MODÉRÉE", "SÉVÈRE"]),
  reaction: z.string().min(1, "Réaction requise"),
});

const patientFormSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  prenom: z.string().min(1, "Prénom requis"),
  email: z.string().min(1, "Email requis").email("Email invalide"),
  telephone: z.string().optional(),
  dateNaissance: z.string().min(1, "Date de naissance requise"),
  genre: z.enum(["", "MASCULIN", "FEMININ"]),
  adresse: z.string().optional(),
  numeroSecuriteSociale: z.string().optional(),
  antecedents: z.string().optional(),
  maladiesChroniques: z.string().optional(),
  chirurgies: z.string().optional(),
  traitementsEnCours: z.string().optional(),
  allergies: z.array(allergySchema),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

const GENRE_OPTIONS = [
  { value: "", label: "Non précisé" },
  { value: "MASCULIN", label: "Masculin" },
  { value: "FEMININ", label: "Féminin" },
];

const SEVERITE_OPTIONS = [
  { value: "LÉGÈRE", label: "Légère" },
  { value: "MODÉRÉE", label: "Modérée" },
  { value: "SÉVÈRE", label: "Sévère" },
];

function patientToFormValues(patient: Patient | null): PatientFormValues {
  if (!patient) {
    return {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      dateNaissance: "",
      genre: "",
      adresse: "",
      numeroSecuriteSociale: "",
      antecedents: "",
      maladiesChroniques: "",
      chirurgies: "",
      traitementsEnCours: "",
      allergies: [],
    };
  }
  return {
    nom: patient.nom,
    prenom: patient.prenom,
    email: patient.email,
    telephone: patient.telephone ?? "",
    dateNaissance: patient.dateNaissance,
    genre: patient.genre ?? "",
    adresse: patient.adresse ?? "",
    numeroSecuriteSociale: patient.numeroSecuriteSociale ?? "",
    antecedents: patient.historiqueMedical?.antecedents ?? "",
    maladiesChroniques: patient.historiqueMedical?.maladiesChroniques ?? "",
    chirurgies: patient.historiqueMedical?.chirurgies ?? "",
    traitementsEnCours: patient.historiqueMedical?.traitementsEnCours ?? "",
    allergies: patient.allergies,
  };
}

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export function PatientFormModal({
  isOpen,
  onClose,
  patient,
}: PatientFormModalProps) {
  const isEdition = patient !== null;
  const { mutate: creer, isPending: isCreating } = useCreatePatient();
  const { mutate: modifier, isPending: isUpdating } = useUpdatePatient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: patientToFormValues(patient),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "allergies",
  });

  useEffect(() => {
    if (isOpen) reset(patientToFormValues(patient));
  }, [isOpen, patient, reset]);

  function onSubmit(values: PatientFormValues) {
    const payload = {
      nom: values.nom,
      prenom: values.prenom,
      email: values.email,
      telephone: values.telephone || undefined,
      dateNaissance: values.dateNaissance,
      genre: values.genre === "" ? undefined : values.genre,
      adresse: values.adresse || undefined,
      numeroSecuriteSociale: values.numeroSecuriteSociale || undefined,
      historiqueMedical: {
        antecedents: values.antecedents || null,
        maladiesChroniques: values.maladiesChroniques || null,
        chirurgies: values.chirurgies || null,
        traitementsEnCours: values.traitementsEnCours || null,
      },
      allergies: values.allergies,
    };

    if (isEdition && patient) {
      modifier(
        { id: patient.id, payload },
        {
          onSuccess: () => {
            toast.success("Patient modifié avec succès");
            onClose();
          },
          onError: (err) => toast.error(getErrorMessage(err)),
        },
      );
    } else {
      creer(payload, {
        onSuccess: () => {
          toast.success("Patient créé avec succès");
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    }
  }

  const isPending = isCreating || isUpdating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdition ? "Modifier le patient" : "Nouveau patient"}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Identité</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nom"
              required
              placeholder="Ex : Diallo"
              error={errors.nom?.message}
              {...register("nom")}
            />
            <Input
              label="Prénom"
              required
              placeholder="Ex : Ibrahima"
              error={errors.prenom?.message}
              {...register("prenom")}
            />
            <Input
              label="Email"
              type="email"
              placeholder="Ex : patient@email.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Téléphone"
              placeholder="Ex : +224 620 00 00 00"
              {...register("telephone")}
            />
            <Input
              label="Date de naissance"
              type="date"
              required
              error={errors.dateNaissance?.message}
              {...register("dateNaissance")}
            />
            <Select
              label="Genre"
              required
              options={GENRE_OPTIONS}
              {...register("genre")}
            />
            <Input
              label="Adresse"
              placeholder="Ex : Kaloum, Conakry"
              {...register("adresse")}
            />
            <Input
              label="Numéro de sécurité sociale"
              placeholder="Ex : 1 234 567 890"
              {...register("numeroSecuriteSociale")}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Historique médical
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Antécédents"
              placeholder="Ex : Diabète type 2, HTA"
              {...register("antecedents")}
            />
            <Input
              label="Maladies chroniques"
              placeholder="Ex : Asthme"
              {...register("maladiesChroniques")}
            />
            <Input
              label="Chirurgies"
              placeholder="Ex : Appendicectomie 2018"
              {...register("chirurgies")}
            />
            <Input
              label="Traitements en cours"
              placeholder="Ex : Metformine 500mg"
              {...register("traitementsEnCours")}
            />
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Allergies</h3>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                append({ nom: "", severite: "LÉGÈRE", reaction: "" })
              }
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
          {fields.length === 0 && (
            <p className="text-sm text-gray-500">Aucune allergie renseignée.</p>
          )}
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3 rounded-md border border-gray-200 p-3"
              >
                <Input
                  label="Allergène"
                  placeholder="Ex : Pénicilline"
                  error={errors.allergies?.[index]?.nom?.message}
                  {...register(`allergies.${index}.nom`)}
                />
                <Select
                  label="Sévérité"
                  options={SEVERITE_OPTIONS}
                  {...register(`allergies.${index}.severite`)}
                />
                <Input
                  label="Réaction"
                  placeholder="Ex : Urticaire, choc"
                  error={errors.allergies?.[index]?.reaction?.message}
                  {...register(`allergies.${index}.reaction`)}
                />
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
        </section>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {isEdition ? "Enregistrer" : "Créer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
