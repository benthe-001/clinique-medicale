import { Component, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import { PrescriptionService } from '../services/prescription.service';
import { PatientService } from '../../patients/services/patient.service';
import { UserService, UserSummary } from '../../../core/services/user.service';
import { Patient } from '../../patients/models/patient.model';
import { LucideAngularModule, X, Plus, Trash2, Save } from 'lucide-angular';

@Component({
  selector: 'app-prescription-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './prescription-form.component.html',
})
export class PrescriptionFormComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly X = X;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly Save = Save;

  form!: FormGroup;
  loading = signal(false);
  error = signal('');
  patients = signal<Patient[]>([]);
  medecins = signal<UserSummary[]>([]);

  constructor(
    private fb: FormBuilder,
    private prescriptionService: PrescriptionService,
    private patientService: PatientService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      patientId: ['', Validators.required],
      medecinId: ['', Validators.required],
      appointmentId: [''],
      datePrescription: ['', Validators.required],
      dateExpiration: ['', Validators.required],
      diagnostic: [''],
      notes: [''],
      medicaments: this.fb.array([this.createDrugLine()]),
    });

    this.patientService
      .lister()
      .subscribe({ next: (p) => this.patients.set(p) });
    this.userService
      .getMedecins()
      .subscribe({ next: (m) => this.medecins.set(m) });
  }

  get medicamentsArray(): FormArray {
    return this.form.get('medicaments') as FormArray;
  }

  createDrugLine() {
    return this.fb.group({
      medicament: ['', Validators.required],
      dosage: [
        '',
        [
          Validators.pattern(
            /^\d+(\.\d+)?\s*(mg|g|ml|mcg|µg|UI|comprimé|comprimés|gélule|gélules|goutte|gouttes)$/i,
          ),
        ],
      ],
      frequence: [''],
      duree: [
        '',
        [Validators.pattern(/^\d+\s*(jour|jours|semaine|semaines|mois)$/i)],
      ],
      instructions: [''],
    });
  }

  addDrug() {
    this.medicamentsArray.push(this.createDrugLine());
  }
  removeDrug(i: number) {
    this.medicamentsArray.removeAt(i);
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.prescriptionService.creer(this.form.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.saved.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erreur lors de la création');
      },
    });
  }
}
