import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClaimService } from '../../../../core/services/claim';
import { Claim, ClaimStatus, ReceivedClaim } from '../../../../core/models/claim.model';

@Component({
  selector: 'app-my-claims',
  imports: [RouterLink],
  templateUrl: './my-claims.html',
  styleUrl: './my-claims.scss',
})
export class MyClaims {
  claims: Claim[] = [];
  receivedClaims: ReceivedClaim[] = [];
  loadingSubmitted = true;
  loadingReceived = true;
  submittedError = '';
  receivedError = '';
  actionError = '';
  actionClaimId: number | null = null;

  constructor(
    private readonly claimService: ClaimService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {
    this.loadSubmittedClaims();
    this.loadReceivedClaims();
  }

  accept(claim: ReceivedClaim): void {
    this.actionClaimId = claim.id;
    this.actionError = '';
    this.claimService.acceptClaim(claim.id).subscribe({
      next: () => {
        claim.status = 'ACCEPTED';
        claim.item.status = 'CLAIMED';
        for (const otherClaim of this.receivedClaims) {
          if (
            otherClaim.id !== claim.id &&
            otherClaim.item.id === claim.item.id &&
            otherClaim.status === 'PENDING'
          ) {
            otherClaim.status = 'REJECTED';
          }
        }
        this.actionClaimId = null;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.actionError = "Impossible d'accepter cette réclamation.";
        this.actionClaimId = null;
        this.changeDetector.markForCheck();
      },
    });
  }

  reject(claim: ReceivedClaim): void {
    this.actionClaimId = claim.id;
    this.actionError = '';
    this.claimService.rejectClaim(claim.id).subscribe({
      next: () => {
        claim.status = 'REJECTED';
        this.actionClaimId = null;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.actionError = 'Impossible de refuser cette réclamation.';
        this.actionClaimId = null;
        this.changeDetector.markForCheck();
      },
    });
  }

  openAttachment(claim: ReceivedClaim): void {
    this.actionClaimId = claim.id;
    this.actionError = '';
    this.claimService.getAttachment(claim.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        this.actionClaimId = null;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.actionError = "Impossible d'ouvrir le justificatif.";
        this.actionClaimId = null;
        this.changeDetector.markForCheck();
      },
    });
  }

  statusLabel(status: ClaimStatus): string {
    return {
      PENDING: 'En attente',
      ACCEPTED: 'Acceptée',
      REJECTED: 'Refusée',
      COMPLETED: 'Terminée',
    }[status];
  }

  private loadSubmittedClaims(): void {
    this.claimService.getMyClaims().subscribe({
      next: (claims) => {
        this.claims = claims;
        this.loadingSubmitted = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.submittedError = 'Impossible de charger vos réclamations envoyées.';
        this.loadingSubmitted = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private loadReceivedClaims(): void {
    this.claimService.getReceivedClaims().subscribe({
      next: (claims) => {
        this.receivedClaims = claims;
        this.loadingReceived = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.receivedError = 'Impossible de charger les réclamations reçues.';
        this.loadingReceived = false;
        this.changeDetector.markForCheck();
      },
    });
  }
}
