import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api-config';

export type RecoveryStatus = 'PENDING' | 'SCHEDULED' | 'VERIFIED' | 'COMPLETED' | 'CANCELLED';
export type RecoveryParticipantRole = 'FINDER' | 'CLAIMANT' | 'ADMIN';

export interface RecoveryView {
  claimId: number;
  claimStatus: 'ACCEPTED' | 'COMPLETED';
  item: {
    id: number;
    title: string;
    type: 'LOST' | 'FOUND';
    status: 'ACTIVE' | 'CLAIMED' | 'RETURNED' | 'CLOSED';
  };
  participantRole: RecoveryParticipantRole;
  status: RecoveryStatus;
  meetingLocation: string | null;
  meetingDate: string | null;
  verificationCode?: string | null;
  hasVerificationCode: boolean;
  verificationCodeExpiresAt: string | null;
  codeExpired: boolean;
  attemptsRemaining: number;
  codeVerifiedAt: string | null;
  finderConfirmed: boolean;
  claimantConfirmed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RecoveryService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/recovery`;

  getRecovery(claimId: number) {
    return this.http.get<RecoveryView>(`${this.apiUrl}/${claimId}`);
  }

  updateMeeting(claimId: number, data: { location: string; date: string; time: string }) {
    return this.http.patch<RecoveryView>(`${this.apiUrl}/${claimId}/meeting`, data);
  }

  verifyCode(claimId: number, code: string) {
    return this.http.post<{ valid: boolean; claimId: number; status: 'VERIFIED' }>(
      `${this.apiUrl}/${claimId}/verify-code`,
      { code },
    );
  }

  confirm(claimId: number, confirmation: 'FINDER' | 'CLAIMANT') {
    return this.http.patch<{
      claimId: number;
      confirmation: 'FINDER' | 'CLAIMANT';
      finderConfirmed: boolean;
      claimantConfirmed: boolean;
      status: RecoveryStatus;
    }>(`${this.apiUrl}/${claimId}/confirm`, { confirmation });
  }
}
