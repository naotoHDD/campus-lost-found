import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MyItems } from './my-items';

describe('MyItems', () => {
  let component: MyItems;
  let fixture: ComponentFixture<MyItems>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyItems],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MyItems);
    component = fixture.componentInstance;
    httpMock.expectOne('/api/items/mine').flush({
      data: [{
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
      }],
      meta: { page: 1, limit: 6, total: 1, totalPages: 1 },
    });
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('loads owned items and persists closing an active post', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Lost wallet');

    component.closeItem(42);

    const request = httpMock.expectOne('/api/items/42');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'CLOSED' });
    request.flush({ ...component.items[0], status: 'CLOSED' });
    expect(component.items[0].status).toBe('CLOSED');
  });
});
