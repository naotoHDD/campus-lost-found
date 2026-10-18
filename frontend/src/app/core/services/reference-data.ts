import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api-config';

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface LocationRecord {
  id: number;
  governorate: string;
  delegation: string;
  locality?: string | null;
  addressText?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  private readonly http = inject(HttpClient);

  getCategories() {
    return this.http.get<Category[]>(`${API_BASE_URL}/categories`);
  }

  getGovernorates() {
    return this.http.get<string[]>(`${API_BASE_URL}/locations/governorates`);
  }

  getLocations() {
    return this.http.get<LocationRecord[]>(`${API_BASE_URL}/locations`);
  }

  createLocation(
    location: Pick<LocationRecord, 'governorate' | 'delegation' | 'locality' | 'addressText'>,
  ) {
    return this.http.post<LocationRecord>(`${API_BASE_URL}/locations`, location);
  }

  updateLocation(
    id: number,
    location: Pick<LocationRecord, 'governorate' | 'delegation' | 'locality' | 'addressText'>,
  ) {
    return this.http.patch<LocationRecord>(`${API_BASE_URL}/locations/${id}`, location);
  }

  deleteLocation(id: number) {
    return this.http.delete(`${API_BASE_URL}/locations/${id}`);
  }

  createCategory(name: string) {
    return this.http.post<Category>(`${API_BASE_URL}/categories`, { name });
  }

  updateCategory(id: number, name: string) {
    return this.http.patch<Category>(`${API_BASE_URL}/categories/${id}`, { name });
  }

  deleteCategory(id: number) {
    return this.http.delete(`${API_BASE_URL}/categories/${id}`);
  }
}
