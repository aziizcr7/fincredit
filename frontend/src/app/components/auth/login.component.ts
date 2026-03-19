// src/app/components/auth/login.component.ts
import { Component }              from '@angular/core';
import { CommonModule }           from '@angular/common';
import { RouterLink, Router }     from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService }            from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="auth-page">
  <div class="auth-card">

    <div class="auth-logo">
      <div class="logo-mark">FC</div>
      <div class="logo-name">Fin<span>Credit</span> Pro</div>
    </div>

    <h2 class="auth-title">Bon retour 👋</h2>
    <p class="auth-sub">Connectez-vous à votre espace bancaire</p>

    <div *ngIf="errorMsg" class="alert-error">
      ⚠️ {{ errorMsg }}
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input formControlName="email" type="email"
               class="form-control"
               [class.is-invalid]="submitted && f['email'].errors"
               placeholder="votre@email.com">
        <div class="form-error" *ngIf="submitted && f['email'].errors?.['required']">Email requis</div>
        <div class="form-error" *ngIf="submitted && f['email'].errors?.['email']">Email invalide</div>
      </div>

      <div class="form-group">
        <label class="form-label">Mot de passe</label>
        <input formControlName="password" type="password"
               class="form-control"
               [class.is-invalid]="submitted && f['password'].errors"
               placeholder="••••••••">
        <div class="form-error" *ngIf="submitted && f['password'].errors?.['required']">Mot de passe requis</div>
      </div>

      <button type="submit" class="btn btn-primary btn-full" [disabled]="loading">
        <span *ngIf="!loading">Se connecter →</span>
        <span *ngIf="loading">Connexion en cours...</span>
      </button>
    </form>

    <div class="auth-demo">
      <p>Comptes de démonstration :</p>
      <div class="demo-chips">
        <span class="demo-chip" (click)="fillAdmin()">👤 Admin</span>
        <span class="demo-chip" (click)="fillClient()">👤 Client</span>
      </div>
    </div>

    <p class="auth-footer">
      Pas encore de compte ?
      <a routerLink="/register">Créer un compte</a>
    </p>
  </div>
</div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 24px; position: relative; z-index: 1;
    }
    .auth-card {
      background: rgba(10,22,40,0.96);
      border: 1px solid rgba(43,107,255,0.18);
      border-radius: 24px;
      padding: 48px 44px;
      width: 100%; max-width: 440px;
      backdrop-filter: blur(40px);
      box-shadow: 0 24px 80px rgba(0,0,0,0.4);
    }
    .auth-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
    .logo-mark {
      width: 42px; height: 42px; border-radius: 10px;
      background: linear-gradient(135deg, #1B4FD8, #00C8FF);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px;
      box-shadow: 0 4px 20px rgba(27,79,216,0.5);
    }
    .logo-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 20px; }
    .logo-name span { color: #00C8FF; }
    .auth-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; margin-bottom: 6px; }
    .auth-sub { font-size: 14px; color: #8B9BB4; margin-bottom: 28px; }
    .alert-error {
      background: rgba(255,77,106,0.1); border: 1px solid rgba(255,77,106,0.3);
      border-radius: 10px; padding: 12px 16px; font-size: 13.5px;
      color: #FF4D6A; margin-bottom: 20px;
    }
    .auth-demo { margin-top: 24px; text-align: center; }
    .auth-demo p { font-size: 12px; color: #8B9BB4; margin-bottom: 8px; }
    .demo-chips { display: flex; gap: 8px; justify-content: center; }
    .demo-chip {
      background: rgba(27,79,216,0.15); border: 1px solid rgba(27,79,216,0.3);
      border-radius: 20px; padding: 5px 14px; font-size: 12px;
      cursor: pointer; transition: all 0.2s; color: #C5CFE0;
      &:hover { background: rgba(27,79,216,0.3); color: #fff; }
    }
    .auth-footer { text-align: center; font-size: 13px; color: #8B9BB4; margin-top: 20px; }
    .auth-footer a { color: #00C8FF; text-decoration: none; font-weight: 500; }
  `]
})
export class LoginComponent {
  form!: FormGroup;
  submitted = false;
  loading   = false;
  errorMsg  = '';

  constructor(
    private fb:   FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  get f() { return this.form.controls; }

  fillAdmin()  { this.form.patchValue({ email: 'admin@fincredit.tn',  password: 'admin123' }); }
  fillClient() { this.form.patchValue({ email: 'client@test.tn', password: 'client123' }); }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading  = true;
    this.errorMsg = '';

    const { email, password } = this.form.value;

    this.auth.login(email, password).subscribe({
      next: (res) => {
        const dest = res.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        this.router.navigate([dest]);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Identifiants incorrects';
        this.loading  = false;
      }
    });
  }
}
