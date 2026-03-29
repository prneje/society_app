import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../services/auth';
import { TranslationService } from '../services/translation';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatIconModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-zinc-900 p-4">
      <div class="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <mat-icon class="scale-150">apartment</mat-icon>
          </div>
          <h1 class="text-2xl font-bold text-zinc-900">Shubharambh</h1>
          <p class="text-zinc-500 text-sm mt-1">Society Management System</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="login()" class="space-y-4">
          <div>
            <label for="username" class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{{ t.t('username') }}</label>
            <input id="username" formControlName="username" type="text" class="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all" placeholder="Enter username">
          </div>
          <div>
            <label for="password" class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{{ t.t('password') }}</label>
            <input id="password" formControlName="password" type="password" class="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all" placeholder="Enter password">
          </div>
          
          @if (error()) {
            <p class="text-red-500 text-xs font-medium text-center">{{ error() }}</p>
          }

          <button type="submit" [disabled]="loading() || loginForm.invalid" class="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            @if (loading()) {
              <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            } @else {
              <mat-icon>login</mat-icon>
              <span>{{ t.t('login') }}</span>
            }
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-zinc-100 text-center">
          <p class="text-xs text-zinc-400">Local Network Access Only</p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  auth = inject(AuthService);
  t = inject(TranslationService);
  router = inject(Router);
  fb = inject(FormBuilder);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  loading = signal(false);
  error = signal('');

  login() {
    if (this.loginForm.invalid) return;
    
    this.loading.set(true);
    this.error.set('');
    const { username, password } = this.loginForm.value;
    
    this.auth.login(username!, password!).subscribe({
      next: (res) => {
        if (res.user.role === 'security') {
          this.router.navigate(['/attendance']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.error.set('Invalid username or password');
        this.loading.set(false);
      }
    });
  }
}
