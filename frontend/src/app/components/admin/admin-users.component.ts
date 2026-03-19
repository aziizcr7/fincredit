// src/app/components/admin/admin-users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { AdminService }      from '../../services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">Gestion des <span class="text-cyan">utilisateurs</span></h1>
      <p class="text-muted">{{ users.length }} utilisateur(s) enregistré(s)</p>
    </div>
  </div>

  <div class="card">
    <div *ngIf="loading" class="text-muted" style="padding:16px 0;">Chargement...</div>
    <table *ngIf="!loading" class="data-table">
      <thead>
        <tr>
          <th>Utilisateur</th>
          <th>Rôle</th>
          <th>Crédits actifs</th>
          <th>Total demandes</th>
          <th>Score crédit</th>
          <th>Inscription</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let u of users">
          <td>
            <div class="td-name">{{ u.name }}</div>
            <div class="td-sub">{{ u.email }}</div>
          </td>
          <td>
            <span class="pill" [class.admin]="u.role === 'admin'">{{ u.role }}</span>
          </td>
          <td>{{ u.active_credits || 0 }}</td>
          <td>{{ u.total_requests || 0 }}</td>
          <td>
            <span [style.color]="u.credit_score >= 700 ? 'var(--success)' : u.credit_score >= 500 ? 'var(--warning)' : 'var(--danger)'">
              {{ u.credit_score || 0 }}
            </span>
          </td>
          <td class="td-sub">{{ u.created_at | date:'dd/MM/yyyy' }}</td>
          <td>
            <span class="status" [class]="u.is_active ? 'active' : 'rejected'">
              <div class="status-dot"></div>
              {{ u.is_active ? 'Actif' : 'Inactif' }}
            </span>
          </td>
          <td>
            <button *ngIf="u.role !== 'admin'"
                    class="btn"
                    [class]="u.is_active ? 'btn-danger' : 'btn-success'"
                    (click)="toggle(u)">
              {{ u.is_active ? 'Désactiver' : 'Activer' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; }
    .page-title  { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; letter-spacing:-0.5px; }
  `]
})
export class AdminUsersComponent implements OnInit {
  users:   any[] = [];
  loading = true;

  constructor(private adminSvc: AdminService) {}

  ngOnInit(): void {
    this.adminSvc.getAllUsers().subscribe({
      next: res => { this.users = res.users || []; this.loading = false; },
      error: () => this.loading = false
    });
  }

  toggle(user: any): void {
    this.adminSvc.toggleUser(user.id).subscribe({
      next: res => { user.is_active = res.user.is_active; }
    });
  }
}
