import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, AuditReport } from '../services/api';
import { TranslationService } from '../services/translation';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-audit-report',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-zinc-900">Financial Audit Report</h1>
          <p class="text-zinc-500 mt-1">Comprehensive review of financial year activities.</p>
        </div>
        <div class="flex items-center gap-3">
          <select [(ngModel)]="selectedYear" (change)="load()" class="px-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all bg-white text-sm font-medium">
            @for (year of years; track year) {
              <option [value]="year">FY {{ year }}-{{ year + 1 }}</option>
            }
          </select>
          <button (click)="exportPDF()" class="flex items-center gap-2 bg-zinc-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-sm">
            <mat-icon class="text-sm">picture_as_pdf</mat-icon>
            <span>Export PDF</span>
          </button>
        </div>
      </header>

      @if (report(); as r) {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
            <p class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Expenses</p>
            <h3 class="text-2xl font-bold text-zinc-900">₹{{ r.summary.totalExpenses | number }}</h3>
          </div>
          <div class="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
            <p class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Expense Entries</p>
            <h3 class="text-2xl font-bold text-zinc-900">{{ r.summary.expenseCount }}</h3>
          </div>
          <div class="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
            <p class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Attendance Logs</p>
            <h3 class="text-2xl font-bold text-zinc-900">{{ r.summary.attendanceCount }}</h3>
          </div>
          <div class="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
            <p class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Audit Actions</p>
            <h3 class="text-2xl font-bold text-zinc-900">{{ r.summary.logCount }}</h3>
          </div>
        </div>

        <!-- Detailed Sections -->
        <div class="space-y-6">
          <div class="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            <div class="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 class="font-bold">Expense Breakdown</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="bg-zinc-50 border-b border-zinc-100">
                    <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                    <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</th>
                    <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Title</th>
                    <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100">
                  @for (exp of r.expenses; track exp.id) {
                    <tr class="hover:bg-zinc-50 transition-colors">
                      <td class="p-4 text-sm">{{ exp.date | date }}</td>
                      <td class="p-4 text-sm text-zinc-500">{{ exp.category }}</td>
                      <td class="p-4 text-sm font-medium">{{ exp.title }}</td>
                      <td class="p-4 text-sm text-right font-bold">₹{{ exp.amount | number }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            <div class="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 class="font-bold">System Audit Logs</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="bg-zinc-50 border-b border-zinc-100">
                    <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Timestamp</th>
                    <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100">
                  @for (log of r.logs; track log.id) {
                    <tr class="hover:bg-zinc-50 transition-colors">
                      <td class="p-4 text-sm text-zinc-500">{{ log.timestamp | date:'medium' }}</td>
                      <td class="p-4 text-sm">{{ log.action }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm">
          <div class="w-12 h-12 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin mb-4"></div>
          <p class="text-zinc-500 font-medium">Generating audit report...</p>
        </div>
      }
    </div>
  `
})
export class AuditReportComponent {
  api = inject(ApiService);
  t = inject(TranslationService);
  
  selectedYear = new Date().getFullYear();
  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  report = signal<AuditReport | null>(null);

  constructor() {
    this.load();
  }

  load() {
    this.report.set(null);
    this.api.getAuditReport(this.selectedYear).subscribe(data => {
      this.report.set(data);
    });
  }

  async exportPDF() {
    const r = this.report();
    if (!r) return;

    const columns = ['Date', 'Category', 'Title', 'Amount'];
    const data = r.expenses.map(e => [e.date, e.category, e.title, e.amount]);
    
    await this.api.exportToPDF(
      `Financial Audit Report FY ${this.selectedYear}-${this.selectedYear + 1}`,
      columns,
      data,
      `Audit_Report_${this.selectedYear}`
    );
  }
}
