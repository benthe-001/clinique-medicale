// src/app/features/appointments/appointment-list/appointment-list.component.ts

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../services/appointment.service';
import { Appointment } from '../models/appointment.model';
import { AppointmentFormComponent } from '../appointment-form/appointment-form.component';
import { PatientService } from '../../patients/services/patient.service';
import { UserService, UserSummary } from '../../../core/services/user.service';
import { Patient } from '../../patients/models/patient.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { fadeInUp, listAnimation } from '../../../shared/animations/animations';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
  LucideAngularModule,
  CalendarPlus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Eye,
  Check,
  X,
  LayoutGrid,
  List,
} from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    AppointmentFormComponent,
    PaginationComponent,
    ConfirmDialogComponent,
  ],
  animations: [fadeInUp, listAnimation],
  templateUrl: './appointment-list.component.html',
})
export class AppointmentListComponent implements OnInit {
  readonly CalendarPlus = CalendarPlus;
  readonly Calendar = Calendar;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Filter = Filter;
  readonly Eye = Eye;
  readonly Check = Check;
  readonly X = X;
  readonly LayoutGrid = LayoutGrid;
  readonly List = List;

  appointments = signal<Appointment[]>([]);
  patients = signal<Patient[]>([]);
  medecins = signal<UserSummary[]>([]);
  loading = signal(true);
  isCancelling = signal(false);
  showForm = signal(false);
  filterStatus = signal('TOUS');
  currentPage = signal(1);
  pageSize = signal(10);

  // Confirmation annulation
  showConfirm = signal(false);
  rdvAAnnuler = signal<Appointment | null>(null);

  constructor(
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private userService: UserService,
    private authService: AuthService,
    private toastService: ToastService,
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    const role = this.authService.userRole();
    const userId = this.authService.currentUser()?.id;

    const rdv$ =
      role === 'MEDECIN' && userId
        ? this.appointmentService.listerParMedecin(userId)
        : this.appointmentService.listerTous();

    forkJoin({
      appointments: rdv$,
      patients: this.patientService.lister(),
      medecins: this.userService.getMedecins(),
    }).subscribe({
      next: ({ appointments, patients, medecins }) => {
        this.appointments.set(appointments);
        this.patients.set(patients);
        this.medecins.set(medecins);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getPatientNom(patientId: string): string {
    const p = this.patients().find((p) => p.id === patientId);
    return p ? `${p.prenom} ${p.nom}` : 'Patient inconnu';
  }

  getMedecinNom(medecinId: string): string {
    const m = this.medecins().find((m) => m.id === medecinId);
    return m ? `Dr. ${m.prenom} ${m.nom}` : 'Médecin inconnu';
  }

  confirmer(id: string) {
    this.appointmentService.confirmer(id).subscribe({
      next: () => {
        this.toastService.success('Rendez-vous confirmé');
        this.loadAll();
      },
      error: () =>
        this.toastService.error('Impossible de confirmer ce rendez-vous'),
    });
  }

  demanderAnnulation(rdv: Appointment) {
    this.rdvAAnnuler.set(rdv);
    this.showConfirm.set(true);
  }

  confirmerAnnulation() {
    const rdv = this.rdvAAnnuler();
    if (!rdv) return;
    this.isCancelling.set(true);
    this.appointmentService.annuler(rdv.id).subscribe({
      next: () => {
        this.toastService.success('Rendez-vous annulé');
        this.showConfirm.set(false);
        this.rdvAAnnuler.set(null);
        this.isCancelling.set(false);
        this.loadAll();
      },
      error: () => {
        this.toastService.error("Impossible d'annuler ce rendez-vous");
        this.isCancelling.set(false);
      },
    });
  }

  annulerConfirmation() {
    this.showConfirm.set(false);
    this.rdvAAnnuler.set(null);
  }

  terminer(id: string) {
    this.appointmentService.terminer(id).subscribe({
      next: () => {
        this.toastService.success('Rendez-vous terminé');
        this.loadAll();
      },
      error: () =>
        this.toastService.error('Impossible de terminer ce rendez-vous'),
    });
  }

  onSaved() {
    this.showForm.set(false);
    this.loadAll();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PLANIFIE':
        return 'badge-info';
      case 'CONFIRME':
        return 'badge-success';
      case 'TERMINE':
        return 'bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full';
      case 'ANNULE':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PLANIFIE':
        return 'Planifié';
      case 'CONFIRME':
        return 'Confirmé';
      case 'TERMINE':
        return 'Terminé';
      case 'ANNULE':
        return 'Annulé';
      default:
        return status;
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  countByStatus(status: string): number {
    return this.appointments().filter((a) => a.status === status).length;
  }

  get filteredAll(): Appointment[] {
    if (this.filterStatus() === 'TOUS') return this.appointments();
    return this.appointments().filter((a) => a.status === this.filterStatus());
  }

  get paginatedAppointments(): Appointment[] {
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
  applyFilter(status: string) {
    this.filterStatus.set(status);
    this.currentPage.set(1);
  }
}
