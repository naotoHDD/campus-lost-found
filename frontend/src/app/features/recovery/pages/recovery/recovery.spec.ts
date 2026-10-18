import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { RecoveryService, RecoveryView } from '../../../../core/services/recovery';
import { Recovery } from './recovery';

describe('Recovery', () => {
  let component: Recovery;
  let fixture: ComponentFixture<Recovery>;
  const recovery: RecoveryView = {
    claimId: 8,
    claimStatus: 'ACCEPTED',
    item: { id: 4, title: 'Black phone', type: 'FOUND', status: 'CLAIMED' },
    participantRole: 'CLAIMANT',
    status: 'SCHEDULED',
    meetingLocation: 'Bibliothèque',
    meetingDate: '2026-10-20T14:00:00.000Z',
    verificationCode: '123456',
    hasVerificationCode: true,
    verificationCodeExpiresAt: '2099-10-20T14:30:00.000Z',
    codeExpired: false,
    attemptsRemaining: 5,
    codeVerifiedAt: null,
    finderConfirmed: false,
    claimantConfirmed: false,
  };
  const recoveryService = {
    getRecovery: () => of(recovery),
    updateMeeting: () => of(recovery),
    verifyCode: () => of({ valid: true, claimId: 8, status: 'VERIFIED' as const }),
    confirm: () =>
      of({
        claimId: 8,
        confirmation: 'CLAIMANT' as const,
        finderConfirmed: true,
        claimantConfirmed: true,
        status: 'COMPLETED' as const,
      }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recovery],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '8' } } } },
        { provide: RecoveryService, useValue: recoveryService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Recovery);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the participant-specific recovery state', () => {
    expect(component.claimId).toBe(8);
    expect(component.recovery).toEqual(recovery);
    expect(component.location).toBe('Bibliothèque');
    expect(component.loading).toBe(false);
  });
});
