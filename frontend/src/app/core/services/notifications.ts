import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api-config';

export interface UserNotification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);

  getMyNotifications() {
    return this.http.get<UserNotification[]>(`${API_BASE_URL}/notifications/my`);
  }
}
