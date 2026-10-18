import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  RecoveryParticipantRole,
  RecoveryService,
  RecoveryStatus,
  RecoveryView,
} from '../../../../core/services/recovery';

@Component({
  selector: 'app-recovery',
  imports: [FormsModule],
  templateUrl: './recovery.html',
  styleUrl: './recovery.scss',
})
export class Recovery implements OnInit {
  claimId = 0;
  recovery?: RecoveryView;
  location = 'Bibliothèque';
  date = '';
  time = '';
  code = '';
  minDate = this.tunisiaDateParts(new Date()).date;
  loading = true;
  busy = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly recoveryService: RecoveryService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.claimId = Number(this.route.snapshot.paramMap.get('claimId'));
    if (!Number.isInteger(this.claimId) || this.claimId <= 0) {
      this.loading = false;
      this.errorMessage = 'Identifiant de réclamation invalide.';
      return;
    }
    this.loadRecovery();
  }

  saveMeeting(): void {
    if (!this.location.trim() || !this.date || !this.time) {
      this.errorMessage = 'Choisissez un lieu, une date et une heure.';
      return;
    }

    this.startAction();
    this.recoveryService
      .updateMeeting(this.claimId, {
        location: this.location.trim(),
        date: this.date,
        time: this.time,
      })
      .subscribe({
        next: (recovery) => {
          this.applyRecovery(recovery);
          this.busy = false;
          this.successMessage = 'Le rendez-vous et le code de récupération sont enregistrés.';
          this.changeDetector.markForCheck();
        },
        error: () => this.finishWithError("Impossible d'enregistrer le rendez-vous."),
      });
  }

  verifyCode(): void {
    if (!/^\d{6}$/.test(this.code)) {
      this.errorMessage = 'Saisissez le code à 6 chiffres affiché par le propriétaire.';
      return;
    }

    this.startAction();
    this.recoveryService.verifyCode(this.claimId, this.code).subscribe({
      next: () => {
        this.successMessage =
          'Code vérifié. Les deux participants peuvent maintenant confirmer la remise.';
        this.busy = false;
        this.loadRecovery(false);
      },
      error: (error: unknown) => this.finishWithError(this.verificationError(error)),
    });
  }

  confirm(confirmation: 'FINDER' | 'CLAIMANT'): void {
    this.startAction();
    this.recoveryService.confirm(this.claimId, confirmation).subscribe({
      next: (result) => {
        if (this.recovery) {
          this.recovery.finderConfirmed = result.finderConfirmed;
          this.recovery.claimantConfirmed = result.claimantConfirmed;
          this.recovery.status = result.status;
          if (result.status === 'COMPLETED') {
            this.recovery.claimStatus = 'COMPLETED';
            this.recovery.item.status = 'RETURNED';
          }
        }
        this.busy = false;
        this.successMessage =
          result.status === 'COMPLETED'
            ? "Restitution terminée. L'objet est marqué comme rendu."
            : 'Votre confirmation a bien été enregistrée.';
        this.changeDetector.markForCheck();
      },
      error: () => this.finishWithError("Impossible d'enregistrer la confirmation."),
    });
  }

  statusLabel(status: RecoveryStatus): string {
    return {
      PENDING: 'À organiser',
      SCHEDULED: 'Rendez-vous planifié',
      VERIFIED: 'Code vérifié',
      COMPLETED: 'Restitution terminée',
      CANCELLED: 'Annulée',
    }[status];
  }

  roleLabel(role: RecoveryParticipantRole): string {
    return {
      FINDER: "Personne ayant trouvé l'objet",
      CLAIMANT: "Propriétaire de l'objet",
      ADMIN: 'Administrateur',
    }[role];
  }

  meetingLabel(): string {
    if (!this.recovery?.meetingDate) return '';
    return new Intl.DateTimeFormat('fr-TN', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Africa/Tunis',
    }).format(new Date(this.recovery.meetingDate));
  }

  expiryLabel(): string {
    if (!this.recovery?.verificationCodeExpiresAt) return '';
    return new Intl.DateTimeFormat('fr-TN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Africa/Tunis',
    }).format(new Date(this.recovery.verificationCodeExpiresAt));
  }

  private loadRecovery(showLoading = true): void {
    if (showLoading) this.loading = true;
    this.recoveryService.getRecovery(this.claimId).subscribe({
      next: (recovery) => {
        this.applyRecovery(recovery);
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.finishWithError('Cette restitution est introuvable ou non autorisée.');
      },
    });
  }

  private applyRecovery(recovery: RecoveryView): void {
    this.recovery = recovery;
    if (recovery.meetingLocation) this.location = recovery.meetingLocation;
    if (recovery.meetingDate) {
      const meeting = this.tunisiaDateParts(new Date(recovery.meetingDate));
      this.date = meeting.date;
      this.time = meeting.time;
    }
    if (recovery.status !== 'SCHEDULED') this.code = '';
  }

  private startAction(): void {
    this.busy = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  private finishWithError(message: string): void {
    this.busy = false;
    this.errorMessage = message;
    this.changeDetector.markForCheck();
  }

  private verificationError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 429) {
        return 'Trop de tentatives. Modifiez le rendez-vous pour générer un nouveau code.';
      }
      const apiMessage = Array.isArray(error.error?.message)
        ? error.error.message.join(' ')
        : String(error.error?.message ?? '');
      if (/expired/i.test(apiMessage)) {
        return 'Ce code a expiré. Modifiez le rendez-vous pour en générer un nouveau.';
      }
    }
    return 'Code incorrect. Vérifiez les chiffres et le nombre de tentatives restantes.';
  }

  private tunisiaDateParts(value: Date): { date: string; time: string } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Tunis',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(value);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((entry) => entry.type === type)?.value ?? '';
    return {
      date: `${part('year')}-${part('month')}-${part('day')}`,
      time: `${part('hour')}:${part('minute')}`,
    };
  }
}
