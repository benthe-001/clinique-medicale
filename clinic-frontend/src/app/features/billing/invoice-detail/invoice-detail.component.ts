import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InvoiceService } from '../services/invoice.service';
import { Invoice } from '../models/invoice.model';
import {
  LucideAngularModule,
  ArrowLeft,
  Receipt,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertTriangle,
} from 'lucide-angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './invoice-detail.component.html',
})
export class InvoiceDetailComponent implements OnInit {
  readonly ArrowLeft = ArrowLeft;
  readonly Receipt = Receipt;
  readonly CreditCard = CreditCard;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Clock = Clock;
  readonly User = User;
  readonly AlertTriangle = AlertTriangle;

  invoice = signal<Invoice | null>(null);
  loading = signal(true);
  showPaiement = signal(false);
  montantPaiement = signal(0);

  // Modal de confirmation d'annulation
  annulerModal = signal(false);
  cancelLoading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private invoiceService: InvoiceService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.invoiceService.getById(id).subscribe({
      next: (i) => {
        this.invoice.set(i);
        this.loading.set(false);
        this.montantPaiement.set(i.montantRestant);
      },
      error: () => this.loading.set(false),
    });
  }

  confirmerPaiement() {
    const inv = this.invoice();
    if (!inv) return;
    this.invoiceService.paiement(inv.id, this.montantPaiement()).subscribe({
      next: (updated) => {
        this.invoice.set(updated);
        this.showPaiement.set(false);
      },
    });
  }

  ouvrirAnnulerModal() {
    this.annulerModal.set(true);
  }

  fermerAnnulerModal() {
    this.annulerModal.set(false);
  }

  confirmerAnnulation() {
    const inv = this.invoice();
    if (!inv) return;
    this.cancelLoading.set(true);
    this.invoiceService.annuler(inv.id).subscribe({
      next: (updated) => {
        this.cancelLoading.set(false);
        this.invoice.set(updated);
        this.annulerModal.set(false);
      },
      error: () => {
        this.cancelLoading.set(false);
      },
    });
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
        return 'Partiellement payée';
      case 'PAYEE':
        return 'Payée';
      case 'ANNULEE':
        return 'Annulée';
      default:
        return status;
    }
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  getLigneTotal(quantite: number, prix: number): number {
    return quantite * prix;
  }
}
