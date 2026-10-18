import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClaimService } from '../../../../core/services/claim';
import { MyClaims } from './my-claims';

describe('MyClaims', () => {
  let component: MyClaims;
  let fixture: ComponentFixture<MyClaims>;
  const claimService = {
    getMyClaims: () => of([]),
    getReceivedClaims: () => of([]),
    acceptClaim: () => of({ id: 1, status: 'ACCEPTED', itemId: 1 }),
    rejectClaim: () => of({ id: 1, status: 'REJECTED', itemId: 1 }),
    getAttachment: () => of(new Blob()),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyClaims],
      providers: [{ provide: ClaimService, useValue: claimService }],
    }).compileComponents();

    fixture = TestBed.createComponent(MyClaims);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads submitted and received claims independently', () => {
    expect(component.claims).toEqual([]);
    expect(component.receivedClaims).toEqual([]);
    expect(component.loadingSubmitted).toBe(false);
    expect(component.loadingReceived).toBe(false);
  });
});
