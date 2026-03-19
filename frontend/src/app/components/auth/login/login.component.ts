import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  form: FormGroup;
  loading  = false;
  errorMsg = '';
  showPass = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true; this.errorMsg = '';
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: (res) => this.router.navigate([res.user.role === 'admin' ? '/admin/dashboard' : '/dashboard']),
      error: (err) => { this.errorMsg = err.error?.message || 'Identifiants incorrects'; this.loading = false; }
    });
  }
}
