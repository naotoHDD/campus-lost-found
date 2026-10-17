import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api-config';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/auth`;
  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  login(data: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data);
  }

  register(data: { name: string; email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data);
  }

  getCurrentUserFromApi() {
    return this.http.get<AuthUser>(`${this.apiUrl}/me`);
  }

  saveSession(response: AuthResponse): void {
    if (!this.isBrowser) return;
    localStorage.setItem('token', response.accessToken);
    localStorage.setItem('role', response.user.role);
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  logout(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean { return this.isBrowser && !!localStorage.getItem('token'); }
  isAdmin(): boolean { return this.isBrowser && localStorage.getItem('role') === 'ADMIN'; }

  getCurrentUser(): AuthUser | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try { return JSON.parse(raw) as AuthUser; } catch { return null; }
  }
}
