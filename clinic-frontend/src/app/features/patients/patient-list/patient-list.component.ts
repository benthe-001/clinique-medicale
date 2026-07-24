// src/app/features/patients/patient-list/patient-list.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../services/patient.service';
import { Patient } from '../models/patient.model';
import { PatientFormComponent } from '../patient-form/patient-form.component';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { fadeInUp, listAnimation } from '../../../shared/animations/animations';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import {
  LucideAngularModule,
  Search,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Users,
  Phone,
  Mail,
  Calendar,
} from 'lucide-angular';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    LucideAngularModule,
    PatientFormComponent,
    PaginationComponent,
    ConfirmDialogComponent,
  ],
  animations: [fadeInUp, listAnimation],
  templateUrl: './patient-list.component.html',
})
export class PatientListComponent implements OnInit {
  readonly Search = Search;
  readonly UserPlus = UserPlus;
  readonly Eye = Eye;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Users = Users;
  readonly Phone = Phone;
  readonly Mail = Mail;
  readonly Calendar = Calendar;

  patients = signal<Patient[]>([]);
  filtered = signal<Patient[]>([]);
  loading = signal(true);
  isDeleting = signal(false);
  searchQuery = signal('');
  showForm = signal(false);
  editPatient = signal<Patient | null>(null);
  currentPage = signal(1);
  pageSize = signal(10);

  // Confirmation suppression
  showConfirm = signal(false);
  patientASupprimer = signal<Patient | null>(null);

  constructor(
    private patientService: PatientService,
    private toastService: ToastService,
  ) {}

  ngOnInit() {
    this.loadPatients();
  }

  loadPatients() {
    this.loading.set(true);
    this.patientService.lister().subscribe({
      next: (patients) => {
        this.patients.set(patients);
        this.filtered.set(patients);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.editPatient.set(null);
    this.showForm.set(true);
  }

  openEdit(patient: Patient) {
    this.editPatient.set(patient);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editPatient.set(null);
  }

  onSaved() {
    this.closeForm();
    this.loadPatients();
    this.toastService.success('Patient enregistré avec succès');
  }

  demanderSuppression(patient: Patient) {
    this.patientASupprimer.set(patient);
    this.showConfirm.set(true);
  }

  confirmerSuppression() {
    const patient = this.patientASupprimer();
    if (!patient) return;
    this.isDeleting.set(true);
    this.patientService.supprimer(patient.id).subscribe({
      next: () => {
        this.toastService.success('Patient supprimé avec succès');
        this.showConfirm.set(false);
        this.patientASupprimer.set(null);
        this.isDeleting.set(false);
        this.loadPatients();
      },
      error: () => {
        this.toastService.error('Erreur lors de la suppression');
        this.isDeleting.set(false);
      },
    });
  }

  annulerSuppression() {
    this.showConfirm.set(false);
    this.patientASupprimer.set(null);
  }

  getAge(dateNaissance: string): number {
    const today = new Date();
    const birth = new Date(dateNaissance);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  getInitials(nom: string, prenom: string): string {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  }

  get filteredAll(): Patient[] {
    const q = this.searchQuery();
    if (!q.trim()) return this.patients();
    return this.patients().filter(
      (p) =>
        p.nom.toLowerCase().includes(q.toLowerCase()) ||
        p.prenom.toLowerCase().includes(q.toLowerCase()) ||
        p.email.toLowerCase().includes(q.toLowerCase()),
    );
  }

  get paginatedPatients(): Patient[] {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredAll.slice(start, start + this.pageSize());
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
  }
  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    if (!query.trim()) {
      this.filtered.set(this.patients());
      return;
    }
    this.patientService.rechercher(query).subscribe({
      next: (results) => this.filtered.set(results),
    });
  }
}
