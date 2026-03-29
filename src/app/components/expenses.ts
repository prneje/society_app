import { Component, inject, signal, OnInit } from '@angular/core';
import { ApiService, Expense } from '../services/api';
import { TranslationService } from '../services/translation';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-expenses',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold tracking-tight">{{ t.t('expenses') }}</h2>
        <div class="flex gap-2">
          <button (click)="exportPDF()" class="bg-white text-zinc-900 border border-zinc-200 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-50 transition-all">
            <mat-icon>picture_as_pdf</mat-icon>
            <span>PDF</span>
          </button>
          <button (click)="exportExcel()" class="bg-white text-zinc-900 border border-zinc-200 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-50 transition-all">
            <mat-icon>table_view</mat-icon>
            <span>Excel</span>
          </button>
          <button (click)="showForm.set(true)" class="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10">
            <mat-icon>add</mat-icon>
            <span>{{ t.t('addExpense') }}</span>
          </button>
        </div>
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 class="text-xl font-bold mb-6">{{ t.t('addExpense') }}</h3>
            <form [formGroup]="expenseForm" (ngSubmit)="save()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label for="title" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('title') }}</label>
                <input id="title" formControlName="title" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all">
              </div>
              <div>
                <label for="amount" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('amount') }}</label>
                <input id="amount" formControlName="amount" type="number" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all">
              </div>
              <div>
                <label for="date" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('date') }}</label>
                <input id="date" formControlName="date" type="date" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all">
              </div>
              <div>
                <label for="category" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('category') }}</label>
                <select id="category" formControlName="category" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all">
                  <option value="Maintenance">Maintenance</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Water">Water</option>
                  <option value="Salary">Salary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label for="receipt" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('receipt') }}</label>
                <input id="receipt" (change)="onFile($event)" type="file" class="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200">
              </div>
              <div class="md:col-span-2">
                <label for="description" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('description') }}</label>
                <textarea id="description" formControlName="description" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all h-24"></textarea>
              </div>
              <div class="md:col-span-2 flex gap-3 pt-4">
                <button type="button" (click)="showForm.set(false)" class="flex-1 px-6 py-3 rounded-xl font-bold border border-zinc-200 hover:bg-zinc-50 transition-all">{{ t.t('cancel') }}</button>
                <button type="submit" [disabled]="expenseForm.invalid" class="flex-1 px-6 py-3 rounded-xl font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-all disabled:opacity-50">{{ t.t('save') }}</button>
              </div>
            </form>
          </div>
        </div>
      }

      <div class="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-zinc-50 border-b border-zinc-100">
              <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('date') }}</th>
              <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('title') }}</th>
              <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('category') }}</th>
              <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('amount') }}</th>
              <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('receipt') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            @for (exp of expenses(); track exp.id) {
              <tr class="hover:bg-zinc-50 transition-colors">
                <td class="p-4 text-sm">{{ exp.date | date }}</td>
                <td class="p-4">
                  <p class="text-sm font-bold">{{ exp.title }}</p>
                  <p class="text-xs text-zinc-400">{{ exp.description }}</p>
                </td>
                <td class="p-4">
                  <span class="px-2 py-1 bg-zinc-100 text-zinc-600 rounded-md text-xs font-medium">{{ exp.category }}</span>
                </td>
                <td class="p-4 text-sm font-bold text-zinc-900">₹{{ exp.amount | number }}</td>
                <td class="p-4">
                  @if (exp.receipt_path) {
                    <a [href]="'/uploads/' + exp.receipt_path" target="_blank" class="text-zinc-400 hover:text-zinc-900 transition-colors">
                      <mat-icon>image</mat-icon>
                    </a>
                  } @else {
                    <span class="text-zinc-300 text-xs">None</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ExpensesComponent implements OnInit {
  api = inject(ApiService);
  t = inject(TranslationService);
  fb = inject(FormBuilder);

  expenses = signal<Expense[]>([]);
  showForm = signal(false);
  file: File | null = null;

  expenseForm = this.fb.group({
    title: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    category: ['Maintenance', Validators.required],
    description: ['']
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getExpenses().subscribe(data => this.expenses.set(data));
  }

  onFile(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      this.file = target.files[0];
    }
  }

  save() {
    if (this.expenseForm.invalid) return;

    const formData = new FormData();
    const formValue = this.expenseForm.value;
    
    Object.entries(formValue).forEach(([k, v]) => {
      if (v !== null && v !== undefined) {
        formData.append(k, v.toString());
      }
    });
    
    if (this.file) formData.append('receipt', this.file);

    this.api.addExpense(formData).subscribe(() => {
      this.showForm.set(false);
      this.expenseForm.reset({
        title: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: 'Maintenance',
        description: ''
      });
      this.file = null;
      this.load();
    });
  }

  exportPDF() {
    const data = this.expenses().map(e => [e.date, e.title, e.category, e.amount]);
    this.api.exportToPDF('Expenses Report', ['Date', 'Title', 'Category', 'Amount'], data, 'expenses');
  }

  exportExcel() {
    this.api.exportToExcel(this.expenses(), 'expenses');
  }
}
