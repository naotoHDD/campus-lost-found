import {
  inject,
  Injectable
} from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { map, timeout } from 'rxjs';

import {
  Item,
  PaginatedItems
} from '../models/item.model';
import { API_BASE_URL } from './api-config';

export interface ItemListQuery {
  search?: string;
  type?: string;
  category?: string;
  governorate?: string;
  delegation?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: 'recent' | 'oldest';
}

@Injectable({
  providedIn: 'root'
})
export class ItemService {

  private http =
    inject(HttpClient);

  private apiUrl = `${API_BASE_URL}/items`;

  getMyItems() {
    return this.http.get<PaginatedItems>(`${this.apiUrl}/mine`).pipe(
      timeout({ first: 30_000 }),
      map(response => this.resolveImages(response)),
    );
  }

  getItems(query: ItemListQuery = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http.get<PaginatedItems>(this.apiUrl, { params }).pipe(
      timeout({ first: 30_000 }),
      map(response => this.resolveImages(response)),
    );
  }

  getItem(id: number) {

    return this.http
      .get<Item>(
        `${this.apiUrl}/${id}`
      ).pipe(
        timeout({ first: 30_000 }),
        map(item => this.resolveImage(item)),
      );

  }

  createItem(
    data: FormData
  ) {

    return this.http
      .post<Item>(
        this.apiUrl,
        data
      ).pipe(
        timeout({ first: 30_000 }),
        map(item => this.resolveImage(item)),
      );

  }

  updateItem(
    id: number,
    data: unknown
  ) {

    return this.http.patch<Item>(
      `${this.apiUrl}/${id}`,
      data
    ).pipe(
      timeout({ first: 30_000 }),
      map(item => this.resolveImage(item)),
    );

  }

  deleteItem(id: number) {

    return this.http.delete(
      `${this.apiUrl}/${id}`
    ).pipe(timeout({ first: 30_000 }));

  }

  private resolveImages(response: PaginatedItems): PaginatedItems {
    return {
      ...response,
      data: response.data.map(item => this.resolveImage(item)),
    };
  }

  private resolveImage(item: Item): Item {
    if (!item.imageUrl || /^https?:\/\//i.test(item.imageUrl)) {
      return item;
    }

    return {
      ...item,
      imageUrl: item.imageUrl.startsWith('/') ? item.imageUrl : `/${item.imageUrl}`,
    };
  }

}
