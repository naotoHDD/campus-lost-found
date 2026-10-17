import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClaimService } from '../../../../core/services/claim';
import {
  Claim
} from '../../../../core/models/claim.model';

@Component({
  selector: 'app-my-claims',
  imports: [
    RouterLink
  ],
  templateUrl: './my-claims.html',
  styleUrl: './my-claims.scss'
})
export class MyClaims {
  claims: Claim[] = [];
  loading = true;
  errorMessage = '';

  constructor(claimService: ClaimService, private readonly changeDetector: ChangeDetectorRef) {
    claimService.getMyClaims().subscribe({
      next: claims => {
        this.claims = claims as Claim[];
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger vos réclamations.';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

}