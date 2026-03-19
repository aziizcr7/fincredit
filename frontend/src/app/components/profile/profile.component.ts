import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  form!: FormGroup;
  user = this.auth.currentUser;
  loading = false;
  saved   = false;

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit(): void {
    const u = this.user();
    this.form = this.fb.group({
      name:       [u?.name || ''],
      phone:      [u?.phone || ''],
      address:    [u?.address || ''],
      profession: [u?.profession || ''],
    });
  }

  onSave(): void {
    this.loading = true;
    this.auth.updateProfile(this.form.value).subscribe({
      next: () => { this.saved = true; this.loading = false; setTimeout(() => this.saved = false, 3000); },
      error: () => { this.loading = false; }
    });
  }

  get initials(): string {
    return (this.user()?.name || '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }
}
