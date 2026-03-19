import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AdminService } from '../../../services/admin.service';
import { AdminStats } from '../../../models';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  stats: AdminStats | null = null;
  loading = true;
  charts: Chart[] = [];

  constructor(private adminSvc: AdminService) {}

  ngOnInit(): void {
    this.adminSvc.getStats().subscribe({
      next: (res) => { this.stats = res.stats; this.loading = false; setTimeout(() => this.buildCharts(), 150); },
      error: () => { this.loading = false; }
    });
  }

  ngAfterViewInit(): void {}

  buildCharts(): void {
    if (!this.stats) return;
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const opts = (c: string) => ({ color: c, font: { size: 11 } });
    const gridColor = 'rgba(255,255,255,0.04)';

    // Statuts
    const c1 = document.getElementById('chartStatus') as HTMLCanvasElement;
    if (c1) this.charts.push(new Chart(c1, {
      type: 'doughnut',
      data: { labels: ['Approuvées','En attente','Refusées'],
              datasets: [{ data: [this.stats.approved, this.stats.pending, this.stats.rejected],
                           backgroundColor: ['rgba(0,214,143,0.75)','rgba(255,181,71,0.75)','rgba(255,77,106,0.75)'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: opts('#8B9BB4') } } }
    }));

    // Par type
    const c2 = document.getElementById('chartByType') as HTMLCanvasElement;
    if (c2 && this.stats.by_type?.length) this.charts.push(new Chart(c2, {
      type: 'bar',
      data: { labels: this.stats.by_type.map(t => t.credit_type),
              datasets: [{ label: 'Demandes', data: this.stats.by_type.map(t => +t.count),
                           backgroundColor: ['rgba(27,79,216,0.7)','rgba(0,200,255,0.6)','rgba(0,214,143,0.6)','rgba(255,181,71,0.6)'], borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false,
                 plugins: { legend: { labels: opts('#8B9BB4') } },
                 scales: { x: { ticks: opts('#8B9BB4'), grid: { color: gridColor } }, y: { ticks: opts('#8B9BB4'), grid: { color: gridColor } } } }
    }));

    // Tendance mensuelle
    const c3 = document.getElementById('chartTrend') as HTMLCanvasElement;
    if (c3 && this.stats.monthly_trend?.length) this.charts.push(new Chart(c3, {
      type: 'line',
      data: { labels: this.stats.monthly_trend.map(t => t.month),
              datasets: [
                { label: 'Demandes',  data: this.stats.monthly_trend.map(t => +t.requests), borderColor: '#2D6AFF', backgroundColor: 'rgba(27,79,216,0.08)', fill: true, tension: 0.4, pointRadius: 4 },
                { label: 'Approuvées', data: this.stats.monthly_trend.map(t => +t.approved), borderColor: '#00D68F', backgroundColor: 'transparent', tension: 0.4, borderDash: [5,5], pointRadius: 4 },
              ] },
      options: { responsive: true, maintainAspectRatio: false,
                 plugins: { legend: { labels: opts('#8B9BB4') } },
                 scales: { x: { ticks: opts('#8B9BB4'), grid: { color: gridColor } }, y: { ticks: opts('#8B9BB4'), grid: { color: gridColor } } } }
    }));
  }

  ngOnDestroy(): void { this.charts.forEach(c => c.destroy()); }
}
