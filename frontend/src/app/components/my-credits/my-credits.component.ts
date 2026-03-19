import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CreditService } from '../../services/credit.service';
import { CreditRequest, Credit } from '../../models';

@Component({
  selector: 'app-my-credits',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './my-credits.component.html',
  styleUrl: './my-credits.component.scss'
})
export class MyCreditsComponent implements OnInit {
  credits: Credit[]       = [];
  requests: CreditRequest[] = [];
  loading = true;
  activeTab = 'requests';
  currentPage = 1;
  totalPages  = 1;

  constructor(private creditSvc: CreditService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    Promise.all([
      this.creditSvc.getUserCredits().toPromise(),
      this.creditSvc.getUserRequests(this.currentPage).toPromise(),
    ]).then(([c, r]: any) => {
      this.credits    = c?.credits  || [];
      this.requests   = r?.requests || [];
      this.totalPages = r?.pagination?.pages || 1;
      this.loading = false;
    }).catch(() => { this.loading = false; });
  }

  setPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.creditSvc.getUserRequests(p).subscribe(r => {
      this.requests   = r.requests;
      this.totalPages = r.pagination.pages;
    });
  }

  statusLabel(s: string): string {
    return s === 'pending' ? 'En attente' : s === 'approved' ? 'Approuvé' : 'Refusé';
  }

  progressPct(credit: Credit): number {
    return Math.min(100, Math.max(0, Math.round((1 - credit.remaining_amount / credit.amount) * 100)));
  }
}
