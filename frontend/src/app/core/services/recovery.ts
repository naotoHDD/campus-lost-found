import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class RecoveryService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/recovery`;

  updateMeeting(claimId: number, data: { location: string; date: string; time: string }) {
    return this.http.patch(`${this.apiUrl}/${claimId}/meeting`, data);
  }

  verifyCode(claimId: number, code: string) {
    return this.http.post(`${this.apiUrl}/${claimId}/verify-code`, { code });
  }

  confirm(claimId: number, confirmation: 'FINDER' | 'CLAIMANT') {
    return this.http.patch(`${this.apiUrl}/${claimId}/confirm`, { confirmation });
  }
}
