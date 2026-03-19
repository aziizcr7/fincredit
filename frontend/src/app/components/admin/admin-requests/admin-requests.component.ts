import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { CreditRequest } from '../../../models';

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './admin-requests.component.html',
  styleUrl: './admin-requests.component.scss'
})
export class AdminRequestsComponent implements OnInit {
  requests: CreditRequest[] = [];
  loading      = true;
  searchTerm   = '';
  statusFilter = '';
  currentPage  = 1;
  totalPages   = 1;
  rejectId     = '';
  rejectReason = '';
  showRejectModal = false;
  processing: string[] = [];

  constructor(private adminSvc: AdminService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.adminSvc.getAllRequests({ status: this.statusFilter, search: this.searchTerm, page: this.currentPage }).subscribe({
      next: (res) => { this.requests = res.requests; this.totalPages = res.pagination?.pages || 1; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  approve(id: string): void {
    if (this.processing.includes(id)) return;
    this.processing.push(id);
    this.adminSvc.approveRequest(id).subscribe({
      next: () => { this.processing = this.processing.filter(x => x !== id); this.load(); },
      error: () => { this.processing = this.processing.filter(x => x !== id); }
    });
  }

  openReject(id: string): void { this.rejectId = id; this.rejectReason = ''; this.showRejectModal = true; }

  confirmReject(): void {
    if (!this.rejectId) return;
    this.processing.push(this.rejectId);
    this.adminSvc.rejectRequest(this.rejectId, this.rejectReason).subscribe({
      next: () => {
        this.processing = this.processing.filter(x => x !== this.rejectId);
        this.showRejectModal = false;
        this.load();
      },
      error: () => { this.processing = this.processing.filter(x => x !== this.rejectId); }
    });
  }

  statusLabel(s: string): string { return s === 'pending' ? 'En attente' : s === 'approved' ? 'Approuvé' : 'Refusé'; }
  isProcessing(id: string): boolean { return this.processing.includes(id); }
  setPage(p: number): void { if (p < 1 || p > this.totalPages) return; this.currentPage = p; this.load(); }
}
