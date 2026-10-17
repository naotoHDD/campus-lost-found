import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ItemService } from '../../../../core/services/item';
import { ReferenceDataService } from '../../../../core/services/reference-data';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: ItemService, useValue: { getItems: () => of({ data: [], meta: { page: 1, limit: 3, total: 0, totalPages: 1 } }) } },
        { provide: ReferenceDataService, useValue: { getGovernorates: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
