import {
  inject,
  Injectable
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';
import { API_BASE_URL } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class ClaimService {

  private http =
    inject(HttpClient);

  private apiUrl = API_BASE_URL;

  createClaim(
    itemId: number,
    data: FormData
  ) {

    return this.http.post(
      `${this.apiUrl}/items/${itemId}/claims`,
      data
    );

  }

  getMyClaims() {

    return this.http.get(
      `${this.apiUrl}/claims/my`
    );

  }

  acceptClaim(
    claimId: number
  ) {

    return this.http.patch(
      `${this.apiUrl}/claims/${claimId}/accept`,
      {}
    );

  }

  rejectClaim(
    claimId: number
  ) {

    return this.http.patch(
      `${this.apiUrl}/claims/${claimId}/reject`,
      {}
    );

  }

}