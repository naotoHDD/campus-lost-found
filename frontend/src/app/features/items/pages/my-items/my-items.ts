import { ChangeDetectorRef, Component } from '@angular/core';

import {
  ItemCard
} from '../../../../shared/components/item-card/item-card';

import {
  Item
} from '../../../../core/models/item.model';

import { ItemService } from '../../../../core/services/item';

@Component({
  selector: 'app-my-items',
  imports: [
    ItemCard
  ],
  templateUrl: './my-items.html',
  styleUrl: './my-items.scss'
})
export class MyItems {
  items: Item[] = [];
  loading = true;
  errorMessage = '';

  constructor(private readonly itemService: ItemService, private readonly changeDetector: ChangeDetectorRef) {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.errorMessage = '';
    this.itemService.getMyItems().subscribe({
      next: response => {
        this.items = response.data;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger vos annonces.';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  closeItem(id: number): void {
    this.itemService.updateItem(id, { status: 'CLOSED' }).subscribe({
      next: updatedItem => {
        this.items = this.items.map(item => item.id === id ? updatedItem : item);
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de fermer cette annonce.';
        this.changeDetector.markForCheck();
      },
    });
  }
}