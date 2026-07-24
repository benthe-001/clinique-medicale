// src/app/shared/components/confirm-dialog/confirm-dialog.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertTriangle } from 'lucide-angular';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  readonly AlertTriangle = AlertTriangle;

  @Input() title = 'Confirmation';
  @Input() message = 'Voulez-vous vraiment effectuer cette action ?';
  @Input() confirmLabel = 'Confirmer';
  @Input() isLoading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
