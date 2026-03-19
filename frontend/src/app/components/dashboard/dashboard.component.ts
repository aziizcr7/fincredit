import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { CreditService } from '../../services/credit.service';
import { Credit, CreditRequest, Notification } from '../../models';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  user          = this.auth.currentUser;
  credits:       Credit[]        = [];
  requests:      CreditRequest[] = [];
  notifications: Notification[]  = [];
  loading = true;
  chart: Chart | null = null;

  get totalAmount():   number { return this.credits.reduce((s, c) => s + +c.amount, 0); }
  get totalMonthly():  number { return this.credits.reduce((s, c) => s + +c.monthly_payment, 0); }
  get activeCredits(): number { return this.credits.filter(c => c.status === 'active').length; }
  get pendingCount():  number { return this.requests.filter(r => r.status === 'pending').length; }

  constructor(private auth: AuthService, private creditSvc: CreditService) {}

  ngOnInit(): void {
    Promise.all([
      this.creditSvc.getUserCredits().toPromise(),
      this.creditSvc.getUserRequests().toPromise(),
      this.creditSvc.getNotifications().toPromise(),
    ]).then(([c, r, n]: any) => {
      this.credits       = c?.credits       || [];
      this.requests      = r?.requests      || [];
      this.notifications = n?.notifications || [];
      this.loading = false;
    }).catch(() => { this.loading = false; });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.buildChart(), 300);
  }

  private buildChart(): void {
    const ctx = document.getElementById('dashChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.chart) this.chart.destroy();
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const monthly = this.totalMonthly || 1240;
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Remboursements (TND)',
          data: months.map(() => monthly + (Math.random() - 0.5) * 100),
          borderColor: '#2D6AFF', backgroundColor: 'rgba(27,79,216,0.1)',
          fill: true, tension: 0.4, pointBackgroundColor: '#2D6AFF', pointRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8B9BB4', font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: '#8B9BB4', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#8B9BB4', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }

  progressPct(credit: Credit): number {
    const pct = (1 - credit.remaining_amount / credit.amount) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  }
}
