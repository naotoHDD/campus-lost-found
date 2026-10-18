import { inject, Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api-config';
import { Claim, ReceivedClaim } from '../models/claim.model';

@Injectable({
  providedIn: 'root',
})
export class ClaimService {
  private http = inject(HttpClient);

  private apiUrl = API_BASE_URL;

  createClaim(itemId: number, data: FormData) {
    return this.http.post<Claim>(`${this.apiUrl}/items/${itemId}/claims`, data);
  }

  getMyClaims() {
    return this.http.get<Claim[]>(`${this.apiUrl}/claims/my`);
  }

  getReceivedClaims() {
    return this.http.get<ReceivedClaim[]>(`${this.apiUrl}/claims/received`);
  }

  getAttachment(claimId: number) {
    return this.http.get(`${this.apiUrl}/claims/${claimId}/attachment`, { responseType: 'blob' });
  }

  acceptClaim(claimId: number) {
    return this.http.patch<{ id: number; status: 'ACCEPTED'; itemId: number }>(
      `${this.apiUrl}/claims/${claimId}/accept`,
      {},
    );
  }

  rejectClaim(claimId: number) {
    return this.http.patch<{ id: number; status: 'REJECTED'; itemId: number }>(
      `${this.apiUrl}/claims/${claimId}/reject`,
      {},
    );
  }
}
