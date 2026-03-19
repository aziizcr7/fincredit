// src/app/components/admin/admin-dashboard.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { RouterLink }    from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AdminService }  from '../../services/admin.service';
import { AdminStats }    from '../../models';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">Tableau de bord <span class="text-cyan">Admin</span></h1>
      <p class="text-muted">Vue globale de la plateforme</p>
    </div>
    <a routerLink="/admin/requests" class="btn btn-primary">📋 Voir les demandes</a>
  </div>

  <div *ngIf="loading" class="text-muted">Chargement des statistiques...</div>

  <ng-container *ngIf="!loading && stats">

    <!-- KPIs -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">DEMANDES TOTALES</div>
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-change up">↑ Ce mois</div>
        <div class="stat-icon">📋</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">EN ATTENTE</div>
        <div class="stat-value" style="color:var(--warning)">{{ stats.pending }}</div>
        <div class="stat-change warn">⏳ À traiter</div>
        <div class="stat-icon">⏳</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">MONTANT ACCORDÉ</div>
        <div class="stat-value" style="font-size:18px;">{{ stats.total_amount | number:'1.0-0' }} TND</div>
        <div class="stat-change up">↑ Cumulé</div>
        <div class="stat-icon">💰</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">TAUX APPROBATION</div>
        <div class="stat-value" style="color:var(--success)">{{ stats.approval_rate }}%</div>
        <div class="stat-change up">↑ Bon taux</div>
        <div class="stat-icon">📈</div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid-2 mb-24">
      <div class="card">
        <div class="card-title">Demandes par type</div>
        <div class="chart-container chart-lg">
          <canvas id="chartByType"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Répartition des statuts</div>
        <div class="chart-container chart-lg">
          <canvas id="chartStatus"></canvas>
        </div>
      </div>
    </div>

    <div class="card mb-24">
      <div class="card-title">Tendance mensuelle</div>
      <div class="chart-container chart-lg">
        <canvas id="chartTrend"></canvas>
      </div>
    </div>

    <!-- Stats détaillées -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Résumé financier</div>
        <div class="mini-stat"><span>Montant moyen accordé</span><strong>{{ stats.avg_amount | number:'1.0-0' }} TND</strong></div>
        <div class="mini-stat"><span>Durée moyenne</span><strong>{{ stats.avg_duration | number:'1.0-0' }} mois</strong></div>
        <div class="mini-stat"><span>Demandes approuvées</span><strong style="color:var(--success)">{{ stats.approved }}</strong></div>
        <div class="mini-stat"><span>Demandes refusées</span><strong style="color:var(--danger)">{{ stats.rejected }}</strong></div>
      </div>
      <div class="card">
        <div class="card-title">Utilisateurs</div>
        <div class="mini-stat"><span>Utilisateurs totaux</span><strong>{{ stats.users.total }}</strong></div>
        <div class="mini-stat"><span>Comptes actifs</span><strong style="color:var(--success)">{{ stats.users.active }}</strong></div>
        <div class="mini-stat"><span>Administrateurs</span><strong>{{ stats.users.admins }}</strong></div>
      </div>
    </div>

  </ng-container>
</div>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:12px; }
    .page-title { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; letter-spacing:-0.5px; }
    .mini-stat { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(43,107,255,0.1); font-size:13.5px; color:var(--silver-light); strong { color:var(--white); } &:last-child { border-bottom:none; } }
  `]
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  stats:   AdminStats | null = null;
  loading = true;
  private charts: Chart[] = [];

  constructor(private adminSvc: AdminService) {}

  ngOnInit(): void {
    this.adminSvc.getStats().subscribe({
      next: res => {
        this.stats  = res.stats;
        this.loading = false;
        setTimeout(() => this.initCharts(), 200);
      },
      error: () => this.loading = false
    });
  }

  ngAfterViewInit(): void {}

  initCharts(): void {
    if (!this.stats) return;

    const opts = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#8B9BB4', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#8B9BB4', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#8B9BB4', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    };

    // Demandes par type
    const c1 = document.getElementById('chartByType') as HTMLCanvasElement;
    if (c1) this.charts.push(new Chart(c1, {
      type: 'bar',
      data: {
        labels: this.stats.by_type.map(t => t.credit_type),
        datasets: [{
          label: 'Demandes',
          data: this.stats.by_type.map(t => +t.count),
          backgroundColor: ['rgba(27,79,216,0.7)','rgba(0,200,255,0.6)','rgba(0,214,143,0.6)','rgba(255,181,71,0.6)'],
          borderRadius: 6,
        }]
      },
      options: { ...opts }
    }));

    // Statuts
    const c2 = document.getElementById('chartStatus') as HTMLCanvasElement;
    if (c2) this.charts.push(new Chart(c2, {
      type: 'doughnut',
      data: {
        labels: ['Approuvées','En attente','Refusées'],
        datasets: [{
          data: [+this.stats.approved, +this.stats.pending, +this.stats.rejected],
          backgroundColor: ['rgba(0,214,143,0.7)','rgba(255,181,71,0.7)','rgba(255,77,106,0.7)'],
          borderWidth: 0,
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#8B9BB4', font: { size: 12 } } } } }
    }));

    // Tendance mensuelle
    const c3 = document.getElementById('chartTrend') as HTMLCanvasElement;
    if (c3 && this.stats.monthly_trend.length > 0) this.charts.push(new Chart(c3, {
      type: 'line',
      data: {
        labels: this.stats.monthly_trend.map(m => m.month),
        datasets: [
          {
            label: 'Demandes reçues',
            data: this.stats.monthly_trend.map(m => +m.requests),
            borderColor: '#2D6AFF', backgroundColor: 'rgba(27,79,216,0.08)',
            fill: true, tension: 0.4,
          },
          {
            label: 'Approuvées',
            data: this.stats.monthly_trend.map(m => +m.approved),
            borderColor: '#00D68F', backgroundColor: 'transparent',
            tension: 0.4, borderDash: [5,4],
          }
        ]
      },
      options: { ...opts }
    }));
  }

  ngOnDestroy(): void { this.charts.forEach(c => c.destroy()); }
}
