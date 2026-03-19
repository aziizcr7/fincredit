// src/app/components/auth/register.component.ts
import { Component }          from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService }        from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="auth-page">
  <div class="auth-card">

    <div class="auth-logo">
      <div class="logo-mark">FC</div>
      <div class="logo-name">Fin<span>Credit</span> Pro</div>
    </div>

    <h2 class="auth-title">Créer un compte</h2>
    <p class="auth-sub">Rejoignez FinCredit Pro en quelques secondes</p>

    <div *ngIf="errorMsg"   class="alert-error">⚠️ {{ errorMsg }}</div>
    <div *ngIf="successMsg" class="alert-success">✅ {{ successMsg }}</div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <label class="form-label">Nom complet</label>
        <input formControlName="name" type="text" class="form-control"
               [class.is-invalid]="submitted && f['name'].errors"
               placeholder="Mohamed Ben Ali">
        <div class="form-error" *ngIf="submitted && f['name'].errors?.['required']">Nom requis</div>
      </div>

      <div class="form-group">
        <label class="form-label">Email</label>
        <input formControlName="email" type="email" class="form-control"
               [class.is-invalid]="submitted && f['email'].errors"
               placeholder="votre@email.com">
        <div class="form-error" *ngIf="submitted && f['email'].errors?.['email']">Email invalide</div>
      </div>

      <div class="form-group">
        <label class="form-label">Téléphone (optionnel)</label>
        <input formControlName="phone" type="tel" class="form-control" placeholder="+216 xx xxx xxx">
      </div>

      <div class="form-group">
        <label class="form-label">Mot de passe</label>
        <input formControlName="password" type="password" class="form-control"
               [class.is-invalid]="submitted && f['password'].errors"
               placeholder="Minimum 8 caractères">
        <div class="form-error" *ngIf="submitted && f['password'].errors?.['minlength']">Minimum 8 caractères</div>
      </div>

      <div class="form-group">
        <label class="form-label">Confirmer le mot de passe</label>
        <input formControlName="confirmPassword" type="password" class="form-control"
               [class.is-invalid]="submitted && form.errors?.['passwordMismatch']"
               placeholder="••••••••">
        <div class="form-error" *ngIf="submitted && form.errors?.['passwordMismatch']">Les mots de passe ne correspondent pas</div>
      </div>

      <button type="submit" class="btn btn-primary btn-full" [disabled]="loading">
        <span *ngIf="!loading">Créer mon compte →</span>
        <span *ngIf="loading">Création en cours...</span>
      </button>
    </form>

    <p class="auth-footer">
      Déjà un compte ? <a routerLink="/login">Se connecter</a>
    </p>
  </div>
</div>
  `,
  styles: [`
    .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; position:relative; z-index:1; }
    .auth-card { background:rgba(10,22,40,0.96); border:1px solid rgba(43,107,255,0.18); border-radius:24px; padding:44px; width:100%; max-width:440px; backdrop-filter:blur(40px); box-shadow:0 24px 80px rgba(0,0,0,0.4); }
    .auth-logo { display:flex; align-items:center; gap:12px; margin-bottom:28px; }
    .logo-mark { width:42px; height:42px; border-radius:10px; background:linear-gradient(135deg,#1B4FD8,#00C8FF); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-weight:800; font-size:18px; }
    .logo-name { font-family:'Syne',sans-serif; font-weight:700; font-size:20px; }
    .logo-name span { color:#00C8FF; }
    .auth-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; margin-bottom:5px; }
    .auth-sub { font-size:14px; color:#8B9BB4; margin-bottom:24px; }
    .alert-error { background:rgba(255,77,106,0.1); border:1px solid rgba(255,77,106,0.3); border-radius:10px; padding:12px 16px; font-size:13px; color:#FF4D6A; margin-bottom:18px; }
    .alert-success { background:rgba(0,214,143,0.1); border:1px solid rgba(0,214,143,0.25); border-radius:10px; padding:12px 16px; font-size:13px; color:#00D68F; margin-bottom:18px; }
    .auth-footer { text-align:center; font-size:13px; color:#8B9BB4; margin-top:18px; }
    .auth-footer a { color:#00C8FF; text-decoration:none; font-weight:500; }
  `]
})
export class RegisterComponent {
  form!: FormGroup;
  submitted = false;
  loading   = false;
  errorMsg  = '';
  successMsg = '';

  constructor(
    private fb:   FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name:            ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      phone:           [''],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatch });
  }

  get f() { return this.form.controls; }

  passwordMatch(control: AbstractControl): ValidationErrors | null {
    const p  = control.get('password')?.value;
    const cp = control.get('confirmPassword')?.value;
    return p && cp && p !== cp ? { passwordMismatch: true } : null;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading  = true;
    this.errorMsg = '';

    const { name, email, password, phone } = this.form.value;

    this.auth.register({ name, email, password, phone: phone || undefined }).subscribe({
      next: (res) => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Erreur lors de l\'inscription';
        this.loading  = false;
      }
    });
  }
}
