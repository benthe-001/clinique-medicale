// src/domain/patient.ts

export type Genre = "MASCULIN" | "FEMININ";

export type AllergySeverite = "LÉGÈRE" | "MODÉRÉE" | "SÉVÈRE";

export interface Allergy {
  nom: string;
  severite: AllergySeverite;
  reaction: string;
}

export interface MedicalHistory {
  antecedents: string | null;
  maladiesChroniques: string | null;
  chirurgies: string | null;
  traitementsEnCours: string | null;
}

/**
 * Forme renvoyée par l'API (GET /api/patients, /api/patients/{id}, /api/patients/search).
 * Ne contient PAS numeroSecuriteSociale, actif, ni updatedAt — voir note ci-dessus.
 */
export interface Patient {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  dateNaissance: string;
  genre: Genre | null;
  adresse: string | null;
  numeroSecuriteSociale: string | null; // ← ajouté, maintenant renvoyé par l'API
  historiqueMedical: MedicalHistory | null;
  allergies: Allergy[];
  createdAt: string;
}

/**
 * Forme envoyée pour créer ou modifier un patient
 * (POST /api/patients, PUT /api/patients/{id}).
 */
export interface PatientPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateNaissance: string;
  genre?: Genre;
  adresse?: string;
  numeroSecuriteSociale?: string;
  historiqueMedical?: MedicalHistory;
  allergies?: Allergy[];
}

const ORDRE_SEVERITE: Record<AllergySeverite, number> = {
  LÉGÈRE: 1,
  MODÉRÉE: 2,
  SÉVÈRE: 3,
};

/**
 * Calcule l'âge du patient à partir de sa date de naissance.
 */
export function calculerAge(dateNaissance: string): number {
  const naissance = new Date(dateNaissance);
  const aujourdHui = new Date();
  let age = aujourdHui.getFullYear() - naissance.getFullYear();
  const moisDiff = aujourdHui.getMonth() - naissance.getMonth();
  if (
    moisDiff < 0 ||
    (moisDiff === 0 && aujourdHui.getDate() < naissance.getDate())
  ) {
    age--;
  }
  return age;
}

export function getNomComplet(
  patient: Pick<Patient, "nom" | "prenom">,
): string {
  return `${patient.prenom} ${patient.nom}`;
}

export function aDesAllergies(patient: Pick<Patient, "allergies">): boolean {
  return patient.allergies.length > 0;
}

/**
 * Retourne la sévérité la plus élevée parmi les allergies du patient.
 * Utile pour afficher un badge d'alerte synthétique sur une fiche ou une liste.
 */
export function getSeveriteMax(allergies: Allergy[]): AllergySeverite | null {
  if (allergies.length === 0) return null;
  return allergies.reduce(
    (max, a) =>
      ORDRE_SEVERITE[a.severite] > ORDRE_SEVERITE[max] ? a.severite : max,
    allergies[0].severite,
  );
}

export function hasHistoriqueMedical(
  patient: Pick<Patient, "historiqueMedical">,
): boolean {
  const h = patient.historiqueMedical;
  if (!h) return false;
  return Boolean(
    h.antecedents ||
    h.maladiesChroniques ||
    h.chirurgies ||
    h.traitementsEnCours,
  );
}

export function compterParGenre(patients: Patient[]) {
  const compteur = { MASCULIN: 0, FEMININ: 0, AUTRE: 0, NON_PRECISE: 0 };
  for (const p of patients) {
    if (p.genre === "MASCULIN") compteur.MASCULIN++;
    else if (p.genre === "FEMININ") compteur.FEMININ++;
    else if (p.genre === "AUTRE") compteur.AUTRE++;
    else compteur.NON_PRECISE++;
  }
  return compteur;
}
