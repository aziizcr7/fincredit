// src/app/components/admin/admin-requests.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { AdminService }      from '../../services/admin.service';
import { CreditRequest }     from '../../models';

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">Gestion des <span class="text-cyan">demandes</span></h1>
      <p class="text-muted">{{ requests.length }} demande(s) — {{ pending }} en attente</p>
    </div>
  </div>

  <!-- Filtres -->
  <div class="filters mb-20">
    <input [(ngModel)]="search" (ngModelChange)="onFilter()"
           class="form-control" style="max-width:280px;"
           placeholder="🔍 Rechercher un client...">
    <select [(ngModel)]="statusFilter" (ngModelChange)="onFilter()" class="form-control" style="max-width:180px;">
      <option value="">Tous les statuts</option>
      <option value="pending">En attente</option>
      <option value="approved">Approuvés</option>
      <option value="rejected">Refusés</option>
    </select>
  </div>

  <!-- Toast -->
  <div *ngIf="toastMsg" class="toast-container">
    <div class="toast" [class]="'toast-' + toastType">
      <span>{{ toastMsg }}</span>
    </div>
  </div>

  <!-- Modale refus -->
  <div *ngIf="showRejectModal" class="modal-overlay" (click)="closeModal()">
    <div class="modal-card" (click)="$event.stopPropagation()">
      <h3 class="modal-title">Motif du refus</h3>
      <textarea [(ngModel)]="rejectReason" class="form-control" rows="4"
                placeholder="Expliquez le motif du refus..."></textarea>
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button class="btn btn-danger" (click)="confirmReject()" [disabled]="!rejectReason">Confirmer le refus</button>
        <button class="btn btn-ghost" (click)="closeModal()">Annuler</button>
      </div>
    </div>
  </div>

  <div class="card">
    <div *ngIf="loading" class="text-muted" style="padding:16px 0;">Chargement...</div>

    <table *ngIf="!loading" class="data-table">
      <thead>
        <tr>
          <th>Réf.</th>
          <th>Client</th>
          <th>Type</th>
          <th>Montant</th>
          <th>Durée</th>
          <th>Mensualité</th>
          <th>Date</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of requests">
          <td class="td-mono">#{{ r.id.slice(0,8).toUpperCase() }}</td>
          <td>
            <div class="td-name">{{ r.client_name }}</div>
            <div class="td-sub">{{ r.client_email }}</div>
          </td>
          <td>{{ typeIcon(r.credit_type) }} {{ r.credit_type }}</td>
          <td class="td-amount">{{ r.amount | number:'1.0-0' }} TND</td>
          <td>{{ r.duration_months }} mois</td>
          <td>{{ r.monthly_payment | number:'1.0-0' }} TND</td>
          <td class="td-sub">{{ r.request_date | date:'dd/MM/yyyy' }}</td>
          <td>
            <span class="status" [class]="r.status">
              <div class="status-dot"></div>
              {{ r.status === 'pending' ? 'En attente' : r.status === 'approved' ? 'Approuvé' : 'Refusé' }}
            </span>
          </td>
          <td>
            <div *ngIf="r.status === 'pending'" style="display:flex;gap:6px;">
              <button class="btn btn-success" (click)="approve(r)" [disabled]="processing === r.id">✓ Valider</button>
              <button class="btn btn-danger"  (click)="openReject(r)" [disabled]="processing === r.id">✗ Refuser</button>
            </div>
            <span *ngIf="r.status !== 'pending'" class="text-muted">—</span>
          </td>
        </tr>
        <tr *ngIf="requests.length === 0">
          <td colspan="9" style="text-align:center;padding:32px;color:var(--silver);">Aucune demande trouvée</td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div *ngIf="pagination.pages > 1" class="pagination">
      <button class="btn btn-ghost" [disabled]="pagination.page <= 1" (click)="loadPage(pagination.page - 1)">← Précédent</button>
      <span class="text-muted">Page {{ pagination.page }} / {{ pagination.pages }}</span>
      <button class="btn btn-ghost" [disabled]="pagination.page >= pagination.pages" (click)="loadPage(pagination.page + 1)">Suivant →</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; }
    .page-title  { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; letter-spacing:-0.5px; }
    .filters { display:flex; gap:12px; flex-wrap:wrap; }
    .pagination { display:flex; align-items:center; justify-content:center; gap:16px; margin-top:20px; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
    .modal-card { background:#0F2040; border:1px solid rgba(43,107,255,0.25); border-radius:16px; padding:28px; width:100%; max-width:420px; }
    .modal-title { font-family:'Syne',sans-serif; font-size:18px; font-weight:700; margin-bottom:16px; }
  `]
})
export class AdminRequestsComponent implements OnInit {
  requests:    CreditRequest[] = [];
  loading    = true;
  processing = '';
  search     = '';
  statusFilter = '';
  toastMsg   = '';
  toastType  = 'success';
  pagination = { page: 1, limit: 20, total: 0, pages: 1 };

  showRejectModal = false;
  rejectReason    = '';
  rejectTarget: CreditRequest | null = null;

  get pending(): number { return this.requests.filter(r => r.status === 'pending').length; }

  constructor(private adminSvc: AdminService) {}

  ngOnInit(): void { this.loadPage(1); }

  loadPage(page: number): void {
    this.loading = true;
    this.adminSvc.getAllRequests({
      status: this.statusFilter || undefined,
      search: this.search       || undefined,
      page,
    }).subscribe({
      next: res => {
        this.requests   = res.requests || [];
        this.pagination = res.pagination || this.pagination;
        this.loading    = false;
      },
      error: () => this.loading = false
    });
  }

  onFilter(): void { this.loadPage(1); }

  approve(r: CreditRequest): void {
    this.processing = r.id;
    this.adminSvc.approveRequest(r.id).subscribe({
      next: () => {
        r.status = 'approved';
        this.showToast('✅ Crédit approuvé avec succès', 'success');
        this.processing = '';
      },
      error: err => {
        this.showToast(err.error?.message || 'Erreur', 'danger');
        this.processing = '';
      }
    });
  }

  openReject(r: CreditRequest): void {
    this.rejectTarget = r;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  closeModal(): void { this.showRejectModal = false; this.rejectTarget = null; }

  confirmReject(): void {
    if (!this.rejectTarget || !this.rejectReason) return;
    const r = this.rejectTarget;
    this.processing = r.id;
    this.adminSvc.rejectRequest(r.id, this.rejectReason).subscribe({
      next: () => {
        r.status = 'rejected';
        r.rejection_reason = this.rejectReason;
        this.showToast('❌ Demande refusée', 'danger');
        this.processing     = '';
        this.closeModal();
      },
      error: err => {
        this.showToast(err.error?.message || 'Erreur', 'danger');
        this.processing = '';
      }
    });
  }

  showToast(msg: string, type: string): void {
    this.toastMsg  = msg;
    this.toastType = type;
    setTimeout(() => this.toastMsg = '', 3500);
  }

  typeIcon(t: string): string { return ({ Immobilier:'🏠', Auto:'🚗', Personnel:'💼', Professionnel:'🏪' } as any)[t] || '💳'; }
}
