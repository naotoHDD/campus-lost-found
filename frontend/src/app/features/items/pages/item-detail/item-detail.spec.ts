import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { ItemDetail } from './item-detail';

describe('ItemDetail', () => {
  let component: ItemDetail;
  let fixture: ComponentFixture<ItemDetail>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '42' } } } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ItemDetail);
    component = fixture.componentInstance;
    httpMock.expectOne('/api/items/42').flush({
      id: 42,
      title: 'Lost wallet',
      description: 'Black wallet',
      type: 'LOST',
      status: 'ACTIVE',
      category: { id: 1, name: 'Portefeuilles' },
      governorate: 'Tunis',
      delegation: 'La Marsa',
      itemDate: '2026-10-05T12:00:00.000Z',
      createdAt: '2026-10-05T12:00:00.000Z',
    });
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('loads a newly created item by its route ID from the API', () => {
    expect(component).toBeTruthy();
    expect(component.item?.id).toBe(42);
    expect(fixture.nativeElement.textContent).toContain('Lost wallet');
  });
});
