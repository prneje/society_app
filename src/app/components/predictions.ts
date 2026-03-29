import { Component, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, PredictionData } from '../services/api';
import { TranslationService } from '../services/translation';
import { MatIconModule } from '@angular/material/icon';
import * as d3 from 'd3';

@Component({
  selector: 'app-predictions',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-zinc-900">Expense Predictions</h1>
          <p class="text-zinc-500 mt-1">AI-driven financial forecasting based on historical trends.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="load()" class="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-6 py-2 rounded-xl font-bold hover:bg-zinc-200 transition-all shadow-sm">
            <mat-icon class="text-sm">refresh</mat-icon>
            <span>Refresh Data</span>
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Chart Section -->
        <div class="lg:col-span-2 bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
          <h3 class="font-bold mb-6 flex items-center gap-2">
            <mat-icon class="text-zinc-400">trending_up</mat-icon>
            Historical vs Predicted Expenses
          </h3>
          <div #chartContainer class="w-full h-[400px] relative">
            <!-- D3 Chart will be rendered here -->
          </div>
        </div>

        <!-- Insights Section -->
        <div class="space-y-6">
          <div class="bg-zinc-900 text-white p-8 rounded-3xl shadow-xl">
            <h3 class="font-bold mb-4 flex items-center gap-2">
              <mat-icon class="text-zinc-400">lightbulb</mat-icon>
              Financial Insights
            </h3>
            <div class="space-y-4">
              @if (predictionData(); as data) {
                @if (data.predictions.length > 0) {
                  <div>
                    <p class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Next Month Forecast</p>
                    <h4 class="text-2xl font-bold">₹{{ data.predictions[0].total | number:'1.0-0' }}</h4>
                  </div>
                  <div>
                    <p class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">6-Month Trend</p>
                    <div class="flex items-center gap-2">
                      @if (getTrend(data) > 0) {
                        <mat-icon class="text-red-400">trending_up</mat-icon>
                        <span class="text-red-400 font-bold">+{{ getTrend(data) | percent }}</span>
                      } @else {
                        <mat-icon class="text-emerald-400">trending_down</mat-icon>
                        <span class="text-emerald-400 font-bold">{{ getTrend(data) | percent }}</span>
                      }
                      <span class="text-zinc-400 text-xs">Estimated growth</span>
                    </div>
                  </div>
                }
              }
            </div>
          </div>

          <div class="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
            <h3 class="font-bold mb-4">Upcoming Forecasts</h3>
            <div class="space-y-4">
              @for (pred of predictionData()?.predictions; track pred.month) {
                <div class="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                  <span class="text-sm font-medium text-zinc-600">{{ pred.month | date:'MMMM yyyy' }}</span>
                  <span class="text-sm font-bold text-zinc-900">₹{{ pred.total | number:'1.0-0' }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PredictionsComponent implements AfterViewInit {
  @ViewChild('chartContainer') chartContainer!: ElementRef;
  
  api = inject(ApiService);
  t = inject(TranslationService);
  predictionData = signal<PredictionData | null>(null);

  ngAfterViewInit() {
    this.load();
  }

  load() {
    this.api.getPredictions().subscribe(data => {
      this.predictionData.set(data);
      this.renderChart(data);
    });
  }

  getTrend(data: PredictionData): number {
    if (data.history.length === 0 || data.predictions.length === 0) return 0;
    const lastHistory = data.history[data.history.length - 1].total;
    const lastPrediction = data.predictions[data.predictions.length - 1].total;
    if (lastHistory === 0) return 0;
    return (lastPrediction - lastHistory) / lastHistory;
  }

  renderChart(data: PredictionData) {
    if (!this.chartContainer) return;
    
    const container = this.chartContainer.nativeElement;
    d3.select(container).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const combinedData = [
      ...data.history.map(d => ({ ...d, type: 'history' })),
      ...data.predictions.map(d => ({ ...d, type: 'prediction' }))
    ];

    const x = d3.scaleTime()
      .domain(d3.extent(combinedData, d => new Date(d.month + '-01')) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(combinedData, d => d.total) as number * 1.1])
      .range([height, 0]);

    // Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('stroke', '#f4f4f5')
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ''));

    // X Axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %y') as (dv: d3.NumberValue | Date, i: number) => string))
      .attr('color', '#a1a1aa');

    // Y Axis
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `₹${d3.format(',.0f')(d as number)}`))
      .attr('color', '#a1a1aa');

    // History Line
    const lineHistory = d3.line<{ month: string; total: number }>()
      .x(d => x(new Date(d.month + '-01')))
      .y(d => y(d.total))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data.history)
      .attr('fill', 'none')
      .attr('stroke', '#18181b')
      .attr('stroke-width', 3)
      .attr('d', lineHistory);

    // Prediction Line (Dashed)
    const predictionPathData = [data.history[data.history.length - 1], ...data.predictions];
    const linePrediction = d3.line<{ month: string; total: number }>()
      .x(d => x(new Date(d.month + '-01')))
      .y(d => y(d.total))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(predictionPathData)
      .attr('fill', 'none')
      .attr('stroke', '#a1a1aa')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,5')
      .attr('d', linePrediction);

    // Points
    svg.selectAll('.dot')
      .data(combinedData)
      .enter()
      .append('circle')
      .attr('cx', d => x(new Date(d.month + '-01')))
      .attr('cy', d => y(d.total))
      .attr('r', 4)
      .attr('fill', d => d.type === 'history' ? '#18181b' : '#a1a1aa');
  }
}
