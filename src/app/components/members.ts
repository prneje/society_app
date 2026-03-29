import { Component, inject, signal, OnInit } from '@angular/core';
import { ApiService, Member } from '../services/api';
import { TranslationService } from '../services/translation';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-members',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold tracking-tight">{{ t.t('members') }}</h2>
        <button (click)="showForm.set(true)" class="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10">
          <mat-icon>person_add</mat-icon>
          <span>{{ t.t('addMember') }}</span>
        </button>
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 class="text-xl font-bold mb-6">{{ t.t('addMember') }}</h3>
            <form [formGroup]="memberForm" (ngSubmit)="save()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label for="name" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('name') }}</label>
                <input id="name" formControlName="name" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all">
              </div>
              <div>
                <label for="role" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('role') }}</label>
                <input id="role" formControlName="role" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all">
              </div>
              <div>
                <label for="phone" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('phone') }}</label>
                <input id="phone" formControlName="phone" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all">
              </div>
              <div class="md:col-span-2">
                <label for="address" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('address') }}</label>
                <input id="address" formControlName="address" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all">
              </div>
              <div class="md:col-span-2">
                <label for="responsibility" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">{{ t.t('responsibility') }}</label>
                <textarea id="responsibility" formControlName="responsibility" class="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 transition-all h-24"></textarea>
              </div>
              <div class="md:col-span-2 flex gap-3 pt-4">
                <button type="button" (click)="showForm.set(false)" class="flex-1 px-6 py-3 rounded-xl font-bold border border-zinc-200 hover:bg-zinc-50 transition-all">{{ t.t('cancel') }}</button>
                <button type="submit" [disabled]="memberForm.invalid" class="flex-1 px-6 py-3 rounded-xl font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-all disabled:opacity-50">{{ t.t('save') }}</button>
              </div>
            </form>
          </div>
        </div>
      }

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (member of members(); track member.id) {
          <div class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                <mat-icon>person</mat-icon>
              </div>
              <span class="px-2 py-1 bg-zinc-50 text-zinc-500 rounded-md text-[10px] font-bold uppercase tracking-wider border border-zinc-100">{{ member.role }}</span>
            </div>
            <h3 class="text-lg font-bold">{{ member.name }}</h3>
            <p class="text-sm text-zinc-500 mt-1 flex items-center gap-2">
              <mat-icon class="text-xs scale-75">phone</mat-icon>
              {{ member.phone }}
            </p>
            <p class="text-xs text-zinc-400 mt-3 line-clamp-2 italic">"{{ member.responsibility }}"</p>
            
            <div class="mt-6 pt-4 border-t border-zinc-50 flex items-center justify-between">
              <span class="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Contact</span>
              <button class="text-zinc-400 hover:text-zinc-900 transition-colors">
                <mat-icon>more_horiz</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class MembersComponent implements OnInit {
  api = inject(ApiService);
  t = inject(TranslationService);
  fb = inject(FormBuilder);

  members = signal<Member[]>([]);
  showForm = signal(false);

  memberForm = this.fb.group({
    name: ['', Validators.required],
    role: ['', Validators.required],
    phone: ['', Validators.required],
    address: [''],
    responsibility: ['']
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getMembers().subscribe(data => this.members.set(data));
  }

  save() {
    if (this.memberForm.invalid) return;

    this.api.addMember(this.memberForm.getRawValue() as Partial<Member>).subscribe(() => {
      this.showForm.set(false);
      this.memberForm.reset();
      this.load();
    });
  }
}
