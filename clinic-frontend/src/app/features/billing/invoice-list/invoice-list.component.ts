import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../services/invoice.service';
import { RouterLink } from '@angular/router';
import { PatientService } from '../../patients/services/patient.service';
import { Invoice } from '../models/invoice.model';
import { Patient } from '../../patients/models/patient.model';
import { InvoiceFormComponent } from '../invoice-form/invoice-form.component';
import { fadeInUp, listAnimation } from '../../../shared/animations/animations';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import {
  LucideAngularModule,
  Receipt,
  Plus,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileDown,
  AlertTriangle,
} from 'lucide-angular';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    InvoiceFormComponent,
    PaginationComponent,
  ],
  animations: [fadeInUp, listAnimation],
  templateUrl: './invoice-list.component.html',
})
export class InvoiceListComponent implements OnInit {
  readonly Receipt = Receipt;
  readonly Plus = Plus;
  readonly CreditCard = CreditCard;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;
  readonly FileDown = FileDown;
  readonly AlertTriangle = AlertTriangle;

  invoices = signal<Invoice[]>([]);
  patients = signal<Patient[]>([]);
  loading = signal(true);
  showForm = signal(false);
  filterStatus = signal('TOUS');
  totalRevenus = signal(0);

  paiementModal = signal(false);
  selectedInvoice = signal<Invoice | null>(null);
  montantPaiement = signal(0);

  // Modal de confirmation d'annulation
  annulerModal = signal(false);
  invoiceIdToCancel = signal<string | null>(null);
  cancelLoading = signal(false);

  currentPage = signal(1);
  pageSize = signal(10);

  constructor(
    private invoiceService: InvoiceService,
    private patientService: PatientService,
    private toastService: ToastService,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    this.loadInvoices();
    this.patientService.lister().subscribe({
      next: (p) => this.patients.set(p),
    });
    if (this.authService.hasAnyRole(['ADMIN'])) {
      this.invoiceService.totalRevenus().subscribe({
        next: (t) => this.totalRevenus.set(t),
      });
    }
  }

  loadInvoices() {
    this.loading.set(true);
    this.invoiceService.listerToutes().subscribe({
      next: (data) => {
        this.invoices.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get filtered(): Invoice[] {
    if (this.filterStatus() === 'TOUS') return this.invoices();
    return this.invoices().filter((i) => i.status === this.filterStatus());
  }

  openPaiement(invoice: Invoice) {
    this.selectedInvoice.set(invoice);
    this.montantPaiement.set(invoice.montantRestant);
    this.paiementModal.set(true);
  }

  confirmerPaiement() {
    const inv = this.selectedInvoice();
    if (!inv) return;
    this.invoiceService.paiement(inv.id, this.montantPaiement()).subscribe({
      next: () => {
        this.paiementModal.set(false);
        this.selectedInvoice.set(null);
        this.loadInvoices();
        this.invoiceService.totalRevenus().subscribe({
          next: (t) => this.totalRevenus.set(t),
        });
      },
    });
  }

  // Ouvre le modal de confirmation au lieu de confirm()
  ouvrirAnnulerModal(id: string) {
    this.invoiceIdToCancel.set(id);
    this.annulerModal.set(true);
  }

  fermerAnnulerModal() {
    this.annulerModal.set(false);
    this.invoiceIdToCancel.set(null);
  }

  confirmerAnnulation() {
    const id = this.invoiceIdToCancel();
    if (!id) return;
    this.cancelLoading.set(true);
    this.invoiceService.annuler(id).subscribe({
      next: () => {
        this.cancelLoading.set(false);
        this.annulerModal.set(false);
        this.invoiceIdToCancel.set(null);
        this.loadInvoices();
        this.toastService.success('Facture annulée');
      },
      error: () => {
        this.cancelLoading.set(false);
        this.toastService.error("Erreur lors de l'annulation");
      },
    });
  }

  onSaved() {
    this.showForm.set(false);
    this.loadInvoices();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'EN_ATTENTE':
        return 'badge-warning';
      case 'PARTIELLEMENT_PAYEE':
        return 'badge-info';
      case 'PAYEE':
        return 'badge-success';
      case 'ANNULEE':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'PARTIELLEMENT_PAYEE':
        return 'Partiel';
      case 'PAYEE':
        return 'Payée';
      case 'ANNULEE':
        return 'Annulée';
      default:
        return status;
    }
  }

  getPatientName(patientId: string): string {
    const p = this.patients().find((p) => p.id === patientId);
    return p ? `${p.prenom} ${p.nom}` : patientId.substring(0, 8) + '...';
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  countByStatus(status: string): number {
    return this.invoices().filter((i) => i.status === status).length;
  }
  downloadPdf(id: string) {
    this.invoiceService.downloadPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facture_${id.substring(0, 8)}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('Facture PDF téléchargée');
      },
      error: () => this.toastService.error('Erreur lors du téléchargement'),
    });
  }

  get filteredAll(): Invoice[] {
    if (this.filterStatus() === 'TOUS') return this.invoices();
    return this.invoices().filter((i) => i.status === this.filterStatus());
  }

  get paginatedInvoices(): Invoice[] {
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
}
