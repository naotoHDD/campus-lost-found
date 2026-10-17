import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from './api-config';
import { ItemService } from './item';

describe('ItemService', () => {
  let service: ItemService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ItemService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('resolves relative image URLs against the backend API origin', () => {
    let imageUrl: string | undefined;
    service.getItems().subscribe(response => imageUrl = response.data[0].imageUrl);

    httpMock.expectOne(`${API_BASE_URL}/items`).flush({
      data: [{
        id: 7,
        title: 'Keys',
        description: 'Found keys',
        type: 'FOUND',
        status: 'ACTIVE',
        imageUrl: '/api/files/keys.jpg',
        category: { id: 1, name: 'Keys' },
        governorate: 'Tunis',
        delegation: 'Tunis',
        itemDate: '2026-10-10T00:00:00.000Z',
        createdAt: '2026-10-10T00:00:00.000Z',
      }],
      meta: { page: 1, limit: 6, total: 1, totalPages: 1 },
    });

    expect(imageUrl).toBe('/api/files/keys.jpg');
  });
});
