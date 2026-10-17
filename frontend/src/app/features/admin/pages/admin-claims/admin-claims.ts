import { ChangeDetectorRef, Component } from '@angular/core';
import { AdminClaim, AdminService } from '../../../../core/services/admin';
@Component({selector:'app-admin-claims',imports:[],templateUrl:'./admin-claims.html',styleUrl:'./admin-claims.scss'})
export class AdminClaims {
  claims: AdminClaim[] = [];
  errorMessage = '';

  constructor(private readonly admin: AdminService, private readonly changeDetector: ChangeDetectorRef) {
    this.loadClaims();
  }

  loadClaims(): void {
    this.admin.getClaims().subscribe({
      next: claims => {
        this.claims = claims;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les réclamations.';
        this.changeDetector.markForCheck();
      },
    });
  }

  accept(claim: AdminClaim): void {
    this.admin.acceptClaim(claim.id).subscribe({
      next: () => {
        claim.status = 'ACCEPTED';
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible d’accepter cette réclamation.';
        this.changeDetector.markForCheck();
      },
    });
  }

  reject(claim: AdminClaim): void {
    this.admin.rejectClaim(claim.id).subscribe({
      next: () => {
        claim.status = 'REJECTED';
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de refuser cette réclamation.';
        this.changeDetector.markForCheck();
      },
    });
  }
}
