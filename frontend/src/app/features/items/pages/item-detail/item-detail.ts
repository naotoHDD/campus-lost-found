import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Item } from '../../../../core/models/item.model';
import { ItemService } from '../../../../core/services/item';
import { LocationPicker } from '../../../../shared/components/location-picker/location-picker';

@Component({ selector: 'app-item-detail', imports: [RouterLink, DatePipe, LocationPicker], templateUrl: './item-detail.html', styleUrl: './item-detail.scss' })
export class ItemDetail {
  item?: Item;
  loading = true;
  errorMessage = '';
  private itemId = 0;

  constructor(route: ActivatedRoute, private readonly itemService: ItemService, private readonly changeDetector: ChangeDetectorRef) {
    this.itemId = Number(route.snapshot.paramMap.get('id'));
    this.loadItem();
  }

  loadItem(): void {
    this.loading = true;
    this.errorMessage = '';
    this.itemService.getItem(this.itemId).subscribe({
      next: item => {
        this.item = item;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.item = undefined;
        this.errorMessage = 'Impossible de charger cet objet. Vérifiez que le backend fonctionne puis réessayez.';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }
}
