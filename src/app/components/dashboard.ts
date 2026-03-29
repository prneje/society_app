import { Component, inject, signal, OnInit, ElementRef, ViewChild, AfterViewInit, effect } from '@angular/core';
import { ApiService, DashboardStats } from '../services/api';
import { TranslationService } from '../services/translation';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <mat-icon>payments</mat-icon>
            </div>
            <span class="text-emerald-600 text-xs font-bold uppercase tracking-wider">Expense</span>
          </div>
          <div class="mt-4">
            <h3 class="text-zinc-500 text-sm font-medium">{{ t.t('totalExpenses') }}</h3>
            <p class="text-3xl font-bold mt-1">₹{{ stats()?.totalExpenses | number }}</p>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <mat-icon>engineering</mat-icon>
            </div>
            <span class="text-blue-600 text-xs font-bold uppercase tracking-wider">Staff</span>
          </div>
          <div class="mt-4">
            <h3 class="text-zinc-500 text-sm font-medium">{{ t.t('staffCount') }}</h3>
            <p class="text-3xl font-bold mt-1">{{ stats()?.staffCount }}</p>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <mat-icon>groups</mat-icon>
            </div>
            <span class="text-purple-600 text-xs font-bold uppercase tracking-wider">Members</span>
          </div>
          <div class="mt-4">
            <h3 class="text-zinc-500 text-sm font-medium">{{ t.t('memberCount') }}</h3>
            <p class="text-3xl font-bold mt-1">{{ stats()?.memberCount }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 class="font-bold text-lg mb-6">Expenses by Category</h3>
          <div #chartContainer class="h-64 w-full"></div>
        </div>

        <div class="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-zinc-100 flex items-center justify-between">
            <h3 class="font-bold text-lg">{{ t.t('recentActivity') }}</h3>
            <mat-icon class="text-zinc-400">history</mat-icon>
          </div>
          <div class="divide-y divide-zinc-100">
            @for (log of stats()?.recentLogs; track log.id) {
              <div class="p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors">
                <div class="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                  <mat-icon>bolt</mat-icon>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium">{{ log.action }}</p>
                  <p class="text-xs text-zinc-400">{{ log.timestamp | date:'medium' }}</p>
                </div>
              </div>
            } @empty {
              <div class="p-12 text-center text-zinc-400">
                <p>No recent activity</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit {
  api = inject(ApiService);
  t = inject(TranslationService);
  stats = signal<DashboardStats | null>(null);
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  constructor() {
    effect(() => {
      if (this.stats()) {
        this.renderChart();
      }
    });
  }

  ngOnInit() {
    this.load();
  }

  ngAfterViewInit() {
    if (this.stats()) {
      this.renderChart();
    }
  }

  load() {
    this.api.getStats().subscribe(data => this.stats.set(data));
  }

  renderChart() {
    if (!this.chartContainer) return;
    const element = this.chartContainer.nativeElement;
    d3.select(element).selectAll('*').remove();

    // Mock category data since backend doesn't provide it yet
    const data = [
      { label: 'Maintenance', value: 4500 },
      { label: 'Electricity', value: 2800 },
      { label: 'Water', value: 1200 },
      { label: 'Security', value: 3500 },
      { label: 'Others', value: 900 }
    ];

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .range([height, 0]);

    x.domain(data.map(d => d.label));
    y.domain([0, d3.max(data, d => d.value) || 0]);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('class', 'text-[10px] text-zinc-400 font-bold uppercase tracking-wider');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('class', 'text-[10px] text-zinc-400 font-bold');

    svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'fill-zinc-900 hover:fill-zinc-700 transition-all cursor-pointer')
      .attr('x', d => x(d.label) || 0)
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.value))
      .attr('height', d => height - y(d.value))
      .attr('rx', 4);
  }
}
