import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { CreditService } from '../../services/credit.service';
import { SimulationResult } from '../../models';

Chart.register(...registerables);

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe, RouterLink],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.scss'
})
export class SimulationComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  result: SimulationResult | null = null;
  loading = false;
  private chart: Chart | null = null;
  private destroy$ = new Subject<void>();

  get durationYears(): string {
    const m = this.form?.get('duration_months')?.value || 0;
    return m >= 12 ? `${(m/12).toFixed(0)} ans` : `${m} mois`;
  }

  constructor(private fb: FormBuilder, private creditSvc: CreditService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      credit_type:       ['Immobilier'],
      amount:            [30000, [Validators.required, Validators.min(1000)]],
      duration_months:   [36,    [Validators.required, Validators.min(6)]],
      interest_rate:     [7.5,   [Validators.required, Validators.min(0.1)]],
      insurance_monthly: [0],
    });

    this.form.valueChanges.pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => this.simulate());

    this.simulate();
  }

  simulate(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.creditSvc.simulate(this.form.value).subscribe({
      next: (res) => {
        this.result  = res.simulation;
        this.loading = false;
        setTimeout(() => this.updateChart(), 50);
      },
      error: () => { this.loading = false; }
    });
  }

  private updateChart(): void {
    if (!this.result) return;
    const ctx = document.getElementById('amortChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.chart) this.chart.destroy();

    const sched = this.result.schedule;
    const step  = Math.max(1, Math.floor(sched.length / 24));
    const data  = sched.filter((_, i) => i % step === 0 || i === sched.length - 1);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(r => `M${r.month}`),
        datasets: [
          { label: 'Capital',   data: data.map(r => r.capital),   backgroundColor: 'rgba(0,214,143,0.7)',  borderRadius: 4, stack: 's' },
          { label: 'Intérêts',  data: data.map(r => r.interest),  backgroundColor: 'rgba(255,181,71,0.65)', borderRadius: 4, stack: 'i' },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8B9BB4', font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: '#8B9BB4', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
          y: { ticks: { color: '#8B9BB4', font: { size: 10 }, callback: (v: any) => v >= 1000 ? (v/1000)+'k' : v }, grid: { color: 'rgba(255,255,255,0.03)' } }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    if (this.chart) this.chart.destroy();
  }
}
