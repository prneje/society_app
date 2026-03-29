import { Component, inject, signal, OnInit } from '@angular/core';
import { ApiService, Attendance } from '../services/api';
import { TranslationService } from '../services/translation';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-attendance',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold tracking-tight">{{ t.t('attendance') }}</h2>
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
            <mat-icon>check_circle</mat-icon>
            <span>{{ t.t('markAttendance') }}</span>
          </button>
        </div>
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 class="text-xl font-bold mb-6">{{ t.t('markAttendance') }}</h3>
            <form [formGroup]="attendanceForm" (ngSubmit)="save()" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="staff_id" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Staff ID / Name</label>
                  <input id="staff_id" formControlName="staff_id" type="number" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all">
                </div>
                <div>
                  <label for="staff_type" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Staff Type</label>
                  <select id="staff_type" formControlName="staff_type" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all">
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Security">Security</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="date" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('date') }}</label>
                  <input id="date" formControlName="date" type="date" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all">
                </div>
                <div>
                  <label for="status" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('status') }}</label>
                  <select id="status" formControlName="status" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all">
                    <option value="Present">{{ t.t('present') }}</option>
                    <option value="Absent">{{ t.t('absent') }}</option>
                  </select>
                </div>
              </div>
              <div>
                <label for="description" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('description') }}</label>
                <textarea id="description" formControlName="description" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all h-24"></textarea>
              </div>
              <div class="flex gap-3 pt-4">
                <button type="button" (click)="showForm.set(false)" class="flex-1 px-6 py-3 rounded-xl font-bold border border-zinc-200 hover:bg-zinc-50 transition-all">{{ t.t('cancel') }}</button>
                <button type="submit" [disabled]="attendanceForm.invalid" class="flex-1 px-6 py-3 rounded-xl font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-all disabled:opacity-50">{{ t.t('save') }}</button>
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
              <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Staff ID</th>
              <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Type</th>
              <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('status') }}</th>
              <th class="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('description') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            @for (att of attendance(); track att.id) {
              <tr class="hover:bg-zinc-50 transition-colors">
                <td class="p-4 text-sm">{{ att.date | date }}</td>
                <td class="p-4 text-sm font-medium">Staff #{{ att.staff_id }}</td>
                <td class="p-4 text-sm text-zinc-500">{{ att.staff_type }}</td>
                <td class="p-4">
                  <span [class.bg-emerald-50]="att.status === 'Present'" [class.text-emerald-600]="att.status === 'Present'"
                        [class.bg-red-50]="att.status === 'Absent'" [class.text-red-600]="att.status === 'Absent'"
                        class="px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                    {{ att.status === 'Present' ? t.t('present') : t.t('absent') }}
                  </span>
                </td>
                <td class="p-4 text-sm text-zinc-500">{{ att.description }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AttendanceComponent implements OnInit {
  api = inject(ApiService);
  t = inject(TranslationService);
  fb = inject(FormBuilder);

  attendance = signal<Attendance[]>([]);
  showForm = signal(false);

  attendanceForm = this.fb.group({
    staff_id: [1, Validators.required],
    staff_type: ['Housekeeping', Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    status: ['Present', Validators.required],
    description: ['']
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getAttendance().subscribe(data => this.attendance.set(data));
  }

  save() {
    if (this.attendanceForm.invalid) return;

    this.api.addAttendance(this.attendanceForm.getRawValue() as Partial<Attendance>).subscribe(() => {
      this.showForm.set(false);
      this.attendanceForm.reset({
        staff_id: 1,
        staff_type: 'Housekeeping',
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        description: ''
      });
      this.load();
    });
  }

  exportPDF() {
    const data = this.attendance().map(a => [a.date, a.staff_id, a.staff_type, a.status, a.description]);
    this.api.exportToPDF('Attendance Report', ['Date', 'Staff ID', 'Type', 'Status', 'Description'], data, 'attendance');
  }

  exportExcel() {
    this.api.exportToExcel(this.attendance(), 'attendance');
  }
}
