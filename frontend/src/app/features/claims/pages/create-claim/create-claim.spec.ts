import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { CreateClaim } from './create-claim';

describe('CreateClaim', () => {
  let component: CreateClaim;
  let fixture: ComponentFixture<CreateClaim>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateClaim],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateClaim);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
