import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';
import { ClaimService } from '../../../../core/services/claim';
import { ItemService } from '../../../../core/services/item';
import { CreateClaim } from './create-claim';

describe('CreateClaim', () => {
  let component: CreateClaim;
  let fixture: ComponentFixture<CreateClaim>;

  const item = {
    id: 42,
    title: 'Sac à dos noir',
    description: 'Trouvé près de la bibliothèque',
    type: 'FOUND' as const,
    status: 'ACTIVE' as const,
    category: { id: 1, name: 'Sacs' },
    governorate: 'Tunis',
    delegation: 'El Menzah',
    itemDate: '2026-10-17T12:00:00.000Z',
    createdAt: '2026-10-17T12:00:00.000Z',
    verificationQuestion: 'Quelle couleur a la doublure intérieure ?',
    author: { id: 7, name: 'Déposant' },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateClaim],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '42' } } } },
        { provide: ItemService, useValue: { getItem: () => of(item) } },
        { provide: ClaimService, useValue: { createClaim: () => of({ id: 1 }) } },
        {
          provide: AuthService,
          useValue: {
            getCurrentUser: () => ({
              id: 9,
              name: 'Claimant',
              email: 'claimant@test.tn',
              role: 'USER',
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateClaim);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads and displays the real verification question', () => {
    expect(component.item?.id).toBe(42);
    expect(fixture.nativeElement.textContent).toContain(
      'Quelle couleur a la doublure intérieure ?',
    );
  });

  it('requires both a sufficiently detailed proof and an answer', () => {
    component.form.controls.proofText.setValue('Bleu');
    component.form.controls.answer.setValue('Rouge');

    expect(component.form.valid).toBe(false);

    component.form.controls.proofText.setValue('Le sac contient un carnet bleu.');
    expect(component.form.valid).toBe(true);
  });

  it('rejects unsupported proof files before upload', () => {
    const file = new File(['bad'], 'preuve.exe', { type: 'application/x-msdownload' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });

    component.onFileSelected({ target: input } as unknown as Event);

    expect(component.selectedFile).toBeUndefined();
    expect(component.fileError).toContain('Format non accepté');
  });
});
