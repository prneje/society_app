import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { TranslationService } from '../services/translation';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="flex h-screen bg-zinc-50 text-zinc-900 font-sans">
      <!-- Sidebar -->
      <aside class="w-64 bg-zinc-900 text-white flex flex-col">
        <div class="p-6 border-b border-zinc-800">
          <h1 class="text-xl font-bold tracking-tight">Shubharambh</h1>
          <p class="text-xs text-zinc-400 mt-1">Society Management</p>
        </div>
        
        <nav class="flex-1 p-4 space-y-2">
          @if (auth.user()?.user?.role === 'admin') {
            <a routerLink="/dashboard" routerLinkActive="bg-zinc-800 text-white" class="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
              <mat-icon>dashboard</mat-icon>
              <span>{{ t.t('dashboard') }}</span>
            </a>
            <a routerLink="/expenses" routerLinkActive="bg-zinc-800 text-white" class="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
              <mat-icon>payments</mat-icon>
              <span>{{ t.t('expenses') }}</span>
            </a>
          }
          
          <a routerLink="/attendance" routerLinkActive="bg-zinc-800 text-white" class="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
            <mat-icon>calendar_today</mat-icon>
            <span>{{ t.t('attendance') }}</span>
          </a>

          @if (auth.user()?.user?.role === 'admin') {
            <a routerLink="/members" routerLinkActive="bg-zinc-800 text-white" class="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
              <mat-icon>groups</mat-icon>
              <span>{{ t.t('members') }}</span>
            </a>

            <a routerLink="/audit-report" routerLinkActive="bg-zinc-800 text-white" class="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
              <mat-icon>assignment</mat-icon>
              <span>Audit Report</span>
            </a>

            <a routerLink="/predictions" routerLinkActive="bg-zinc-800 text-white" class="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
              <mat-icon>auto_graph</mat-icon>
              <span>Predictions</span>
            </a>
            
            <button (click)="api.downloadBackup()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
              <mat-icon>backup</mat-icon>
              <span>Backup DB</span>
            </button>
          }
        </nav>

        <div class="p-4 border-t border-zinc-800">
          <button (click)="auth.logout()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-900/20 transition-all">
            <mat-icon>logout</mat-icon>
            <span>{{ t.t('logout') }}</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <header class="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8">
          <div class="flex items-center gap-4">
            <h2 class="text-lg font-semibold">{{ t.t('welcome') }}</h2>
            @if (api.isOffline()) {
              <div class="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100 animate-pulse">
                <mat-icon class="text-xs scale-75">cloud_off</mat-icon>
                <span>OFFLINE</span>
              </div>
            }
            @if (api.pendingSyncCount() > 0) {
              <div class="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100">
                <mat-icon class="text-xs scale-75 animate-spin">sync</mat-icon>
                <span>{{ api.pendingSyncCount() }} PENDING SYNC</span>
              </div>
            }
          </div>
          
          <div class="flex items-center gap-4">
            <div class="flex bg-zinc-100 p-1 rounded-lg">
              <button (click)="t.setLanguage('en')" [class.bg-white]="t.currentLang() === 'en'" [class.shadow-sm]="t.currentLang() === 'en'" class="px-3 py-1 rounded-md text-xs font-medium transition-all">EN</button>
              <button (click)="t.setLanguage('mr')" [class.bg-white]="t.currentLang() === 'mr'" [class.shadow-sm]="t.currentLang() === 'mr'" class="px-3 py-1 rounded-md text-xs font-medium transition-all">मराठी</button>
            </div>
            <div class="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center">
              <mat-icon class="text-zinc-500">account_circle</mat-icon>
            </div>
          </div>
        </header>

        <!-- View -->
        <div class="flex-1 overflow-y-auto p-8">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class LayoutComponent {
  auth = inject(AuthService);
  api = inject(ApiService);
  t = inject(TranslationService);
}
