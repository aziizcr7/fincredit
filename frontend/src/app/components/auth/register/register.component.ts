import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

function passwordMatch(ctrl: AbstractControl) {
  const p = ctrl.get('password')?.value;
  const c = ctrl.get('confirm')?.value;
  return p === c ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      name:     ['', [Validators.required, Validators.minLength(2)]],
      email:    ['', [Validators.required, Validators.email]],
      phone:    [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm:  ['', Validators.required],
    }, { validators: passwordMatch });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true; this.errorMsg = '';
    const { name, email, password, phone } = this.form.value;
    this.auth.register({ name, email, password, phone }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => { this.errorMsg = err.error?.message || 'Erreur lors de la création du compte'; this.loading = false; }
    });
  }
}
