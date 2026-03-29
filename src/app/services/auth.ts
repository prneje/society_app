import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private _user = signal<AuthResponse | null>(null);
  user = computed(() => this._user());
  
  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shubharambh_auth');
      if (saved) {
        try {
          this._user.set(JSON.parse(saved));
        } catch {
          localStorage.removeItem('shubharambh_auth');
        }
      }
    }
  }

  login(username: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/login', { username, password }).pipe(
      tap(res => {
        this._user.set(res);
        localStorage.setItem('shubharambh_auth', JSON.stringify(res));
      })
    );
  }

  logout() {
    this._user.set(null);
    localStorage.removeItem('shubharambh_auth');
    this.router.navigate(['/login']);
  }

  getToken() {
    return this._user()?.token;
  }

  isAuthenticated() {
    return !!this._user();
  }
}
