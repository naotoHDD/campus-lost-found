import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../../../core/services/api-config';
import { ItemList } from './item-list';

describe('ItemList', () => {
  let component: ItemList;
  let fixture: ComponentFixture<ItemList>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ItemList);
    component = fixture.componentInstance;
    httpMock.expectOne(request => request.url === `${API_BASE_URL}/items`).flush({
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
    httpMock.expectOne(`${API_BASE_URL}/categories`).flush([]);
    httpMock.expectOne(`${API_BASE_URL}/locations/governorates`).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('renders API items and sends filters and pagination to the backend', () => {
    expect(component).toBeTruthy();
    expect(component.items.map(item => item.title)).toEqual(['Lost wallet']);
    expect(component.totalItems).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Lost wallet');

    component.searchTerm = 'wallet';
    component.typeFilter = 'LOST';
    component.governorateFilter = 'Tunis';
    component.delegationFilter = 'La Marsa';
    component.sort = 'old';
    component.changeFilters();

    const request = httpMock.expectOne(req => req.url === `${API_BASE_URL}/items` && req.params.get('search') === 'wallet');
    expect(request.request.params.get('type')).toBe('LOST');
    expect(request.request.params.get('governorate')).toBe('Tunis');
    expect(request.request.params.get('delegation')).toBe('La Marsa');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('limit')).toBe('6');
    expect(request.request.params.get('sort')).toBe('oldest');
    request.flush({ data: [], meta: { page: 1, limit: 6, total: 12, totalPages: 2 } });

    component.goToPage(2);
    const nextPageRequest = httpMock.expectOne(req => req.url === `${API_BASE_URL}/items` && req.params.get('page') === '2');
    expect(nextPageRequest.request.params.get('page')).toBe('2');
    nextPageRequest.flush({ data: [], meta: { page: 2, limit: 6, total: 12, totalPages: 2 } });
  });
});
