import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api-config';
import { Item, PaginatedItems } from '../models/item.model';

export interface AdminStats {
  totalUsers: number;
  totalItems: number;
  activeItems: number;
  pendingClaims: number;
  returnedItems: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface AdminClaim {
  id: number;
  item: { id: number; title: string };
  claimant: { id: number; name: string; email: string };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  proofText: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/admin`;

  getStats() {
    return this.http.get<AdminStats>(`${this.apiUrl}/stats`);
  }

  getUsers() {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`);
  }

  updateUserRole(userId: number, role: AdminUser['role']) {
    return this.http.patch<AdminUser>(`${this.apiUrl}/users/${userId}/role`, { role });
  }

  getItems() {
    return this.http.get<PaginatedItems>(`${this.apiUrl}/items`);
  }

  getClaims() {
    return this.http.get<AdminClaim[]>(`${this.apiUrl}/claims`);
  }

  acceptClaim(claimId: number) {
    return this.http.patch(`${API_BASE_URL}/claims/${claimId}/accept`, {});
  }

  rejectClaim(claimId: number) {
    return this.http.patch(`${API_BASE_URL}/claims/${claimId}/reject`, {});
  }

  updateItem(itemId: number, data: Partial<Pick<Item, 'title' | 'status'>>) {
    return this.http.patch<Item>(`${API_BASE_URL}/items/${itemId}`, data);
  }

  deleteItem(itemId: number) {
    return this.http.delete(`${API_BASE_URL}/items/${itemId}`);
  }
}
