import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth';
import { Observable, tap, of, catchError, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  
  isOffline = signal(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  pendingSyncCount = signal(0);
  private retryQueue: { url: string, data: unknown, type: 'POST' | 'FormData' }[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('retry_queue');
      if (saved) {
        try {
          this.retryQueue = JSON.parse(saved);
        } catch {
          localStorage.removeItem('retry_queue');
        }
      }
      this.pendingSyncCount.set(this.retryQueue.length);
      window.addEventListener('online', () => {
        this.isOffline.set(false);
        this.processRetryQueue();
      });
      window.addEventListener('offline', () => this.isOffline.set(true));
    }
  }

  private getHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken()}`
    });
  }

  private cacheGet<T>(key: string, obs: Observable<T>): Observable<T> {
    return obs.pipe(
      tap(data => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`cache_${key}`, JSON.stringify(data));
        }
      }),
      catchError(err => {
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(`cache_${key}`);
          if (cached) return of(JSON.parse(cached));
        }
        return throwError(() => err);
      })
    );
  }

  private queuePost(url: string, data: unknown, type: 'POST' | 'FormData' = 'POST'): Observable<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.retryQueue.push({ url, data: type === 'FormData' ? null : data, type });
      if (typeof window !== 'undefined') {
        localStorage.setItem('retry_queue', JSON.stringify(this.retryQueue));
      }
      this.pendingSyncCount.set(this.retryQueue.length);
      return of(undefined);
    }
    return this.http.post<void>(url, data, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          this.retryQueue.push({ url, data: type === 'FormData' ? null : data, type });
          if (typeof window !== 'undefined') {
            localStorage.setItem('retry_queue', JSON.stringify(this.retryQueue));
          }
          this.pendingSyncCount.set(this.retryQueue.length);
          return of(undefined);
        }
        return throwError(() => err);
      })
    );
  }

  private async processRetryQueue() {
    const queue = [...this.retryQueue];
    this.retryQueue = [];
    localStorage.setItem('retry_queue', '[]');
    this.pendingSyncCount.set(0);

    for (const item of queue) {
      if (item.type === 'POST') {
        this.http.post(item.url, item.data, { headers: this.getHeaders() }).subscribe();
      }
      // FormData is tricky to persist in localStorage, so we might skip it or handle it differently
    }
  }

  getStats() {
    return this.cacheGet('stats', this.http.get<DashboardStats>('/api/dashboard/stats', { headers: this.getHeaders() }));
  }

  getExpenses() {
    return this.cacheGet('expenses', this.http.get<Expense[]>('/api/expenses', { headers: this.getHeaders() }));
  }

  addExpense(data: FormData) {
    return this.queuePost('/api/expenses', data, 'FormData');
  }

  getAttendance() {
    return this.cacheGet('attendance', this.http.get<Attendance[]>('/api/attendance', { headers: this.getHeaders() }));
  }

  addAttendance(data: Partial<Attendance>) {
    return this.queuePost('/api/attendance', data);
  }

  getMembers() {
    return this.cacheGet('members', this.http.get<Member[]>('/api/members', { headers: this.getHeaders() }));
  }

  addMember(data: Partial<Member>) {
    return this.queuePost('/api/members', data);
  }

  getAuditReport(year: number) {
    return this.http.get<AuditReport>(`/api/reports/audit?year=${year}`, { headers: this.getHeaders() });
  }

  getPredictions() {
    return this.http.get<PredictionData>('/api/reports/predictions', { headers: this.getHeaders() });
  }

  downloadBackup() {
    window.open(`/api/system/backup?token=${this.auth.getToken()}`, '_blank');
  }

  async exportToPDF(title: string, columns: string[], data: (string | number | null)[][], filename: string) {
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    (doc as unknown as { autoTable: (options: unknown) => void }).autoTable({
      head: [columns],
      body: data,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [24, 24, 27] }
    });
    doc.save(`${filename}.pdf`);
  }

  async exportToExcel(data: unknown[], filename: string) {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}

export interface DashboardStats {
  totalExpenses: number;
  staffCount: number;
  memberCount: number;
  recentLogs: AuditLog[];
}

export interface AuditLog {
  id: number;
  action: string;
  timestamp: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  date: string;
  category: string;
  description: string;
  receipt_path?: string;
}

export interface Attendance {
  id: number;
  staff_id: number;
  staff_type: string;
  date: string;
  status: string;
  description: string;
}

export interface Member {
  id: number;
  name: string;
  role: string;
  phone: string;
  address: string;
  responsibility: string;
}

export interface AuditReport {
  summary: {
    totalExpenses: number;
    expenseCount: number;
    attendanceCount: number;
    logCount: number;
  };
  expenses: Expense[];
  attendance: Attendance[];
  logs: AuditLog[];
}

export interface PredictionData {
  history: { month: string; total: number }[];
  predictions: { month: string; total: number }[];
}
