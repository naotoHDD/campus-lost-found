import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { Profile } from './profile';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getCurrentUserFromApi: () => of({
              id: 1,
              name: 'Test User',
              email: 'test@example.com',
              role: 'USER',
            }),
            logout: () => undefined,
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.user).toEqual({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER',
    });
  });
});
