import { Injectable, signal } from '@angular/core';

export type Language = 'en' | 'mr';

const translations = {
  en: {
    dashboard: 'Dashboard',
    expenses: 'Expenses',
    attendance: 'Attendance',
    members: 'Members',
    logout: 'Logout',
    totalExpenses: 'Total Expenses',
    staffCount: 'Staff Count',
    memberCount: 'Member Count',
    recentActivity: 'Recent Activity',
    addExpense: 'Add Expense',
    addMember: 'Add Member',
    markAttendance: 'Mark Attendance',
    title: 'Title',
    amount: 'Amount',
    date: 'Date',
    category: 'Category',
    description: 'Description',
    receipt: 'Receipt',
    name: 'Name',
    role: 'Role',
    phone: 'Phone',
    address: 'Address',
    responsibility: 'Responsibility',
    status: 'Status',
    present: 'Present',
    absent: 'Absent',
    save: 'Save',
    cancel: 'Cancel',
    login: 'Login',
    username: 'Username',
    password: 'Password',
    welcome: 'Welcome to Shubharambh'
  },
  mr: {
    dashboard: 'डॅशबोर्ड',
    expenses: 'खर्च',
    attendance: 'हजेरी',
    members: 'सदस्य',
    logout: 'बाहेर पडा',
    totalExpenses: 'एकूण खर्च',
    staffCount: 'कर्मचारी संख्या',
    memberCount: 'सदस्य संख्या',
    recentActivity: 'अलीकडील क्रियाकलाप',
    addExpense: 'खर्च जोडा',
    addMember: 'सदस्य जोडा',
    markAttendance: 'हजेरी नोंदवा',
    title: 'शीर्षक',
    amount: 'रक्कम',
    date: 'तारीख',
    category: 'वर्ग',
    description: 'वर्णन',
    receipt: 'पावती',
    name: 'नाव',
    role: 'भूमिका',
    phone: 'फोन',
    address: 'पत्ता',
    responsibility: 'जबाबदारी',
    status: 'स्थिती',
    present: 'हजर',
    absent: 'गैरहजर',
    save: 'जतन करा',
    cancel: 'रद्द करा',
    login: 'लॉगिन',
    username: 'वापरकर्ता नाव',
    password: 'पासवर्ड',
    welcome: 'शुभारंभ मध्ये आपले स्वागत आहे'
  }
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  currentLang = signal<Language>('en');

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shubharambh_lang', lang);
    }
  }

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shubharambh_lang') as Language;
      if (saved) this.currentLang.set(saved);
    }
  }

  t(key: keyof typeof translations.en): string {
    return translations[this.currentLang()][key] || key;
  }
}
