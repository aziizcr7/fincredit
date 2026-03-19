import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CreditService } from '../../services/credit.service';

@Component({
  selector: 'app-credit-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './credit-request.component.html',
  styleUrl: './credit-request.component.scss'
})
export class CreditRequestComponent {
  form: FormGroup;
  loading   = false;
  success   = false;
  errorMsg  = '';
  files: File[] = [];
  dragOver  = false;

  constructor(private fb: FormBuilder, private creditSvc: CreditService, private router: Router) {
    this.form = this.fb.group({
      credit_type:     ['Immobilier', Validators.required],
      amount:          ['', [Validators.required, Validators.min(1000)]],
      duration_months: ['36', Validators.required],
      purpose:         [''],
      profession:      ['', Validators.required],
      income:          ['', [Validators.required, Validators.min(0)]],
    });
  }

  onFileDrop(e: DragEvent): void {
    e.preventDefault(); this.dragOver = false;
    const f = Array.from(e.dataTransfer?.files || []);
    this.addFiles(f);
  }

  onFileSelect(e: Event): void {
    const input = e.target as HTMLInputElement;
    const f = Array.from(input.files || []);
    this.addFiles(f);
  }

  addFiles(files: File[]): void {
    const allowed = ['application/pdf','image/jpeg','image/jpg','image/png'];
    files.forEach(f => {
      if (allowed.includes(f.type) && f.size <= 5*1024*1024 && this.files.length < 5) {
        this.files.push(f);
      }
    });
  }

  removeFile(i: number): void { this.files.splice(i, 1); }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true; this.errorMsg = '';

    const fd = new FormData();
    const vals = this.form.value;
    fd.append('credit_type',     vals.credit_type);
    fd.append('amount',          vals.amount);
    fd.append('duration_months', vals.duration_months);
    fd.append('purpose',         vals.purpose || '');
    this.files.forEach(f => fd.append('documents', f));

    this.creditSvc.createRequest(fd).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (err) => { this.errorMsg = err.error?.message || 'Erreur lors de la soumission'; this.loading = false; }
    });
  }
}
