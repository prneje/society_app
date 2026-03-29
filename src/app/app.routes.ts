import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth';
import { Router } from '@angular/router';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  router.navigate(['/login']);
  return false;
};

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./components/layout').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./components/dashboard').then(m => m.DashboardComponent) },
      { path: 'expenses', loadComponent: () => import('./components/expenses').then(m => m.ExpensesComponent) },
      { path: 'attendance', loadComponent: () => import('./components/attendance').then(m => m.AttendanceComponent) },
      { path: 'members', loadComponent: () => import('./components/members').then(m => m.MembersComponent) },
      { path: 'audit-report', loadComponent: () => import('./components/audit-report').then(m => m.AuditReportComponent) },
      { path: 'predictions', loadComponent: () => import('./components/predictions').then(m => m.PredictionsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
