import {
  Component,
  Input
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Item } from '../../../core/models/item.model';

@Component({
  selector: 'app-item-card',
  imports: [
    RouterLink,
    DatePipe
  ],
  templateUrl: './item-card.html',
  styleUrl: './item-card.scss'
})
export class ItemCard {

  @Input({
    required: true
  })
  item!: Item;

  get statusLabel(): string {

    switch (this.item.status) {

      case 'ACTIVE':
        return 'Actif';

      case 'CLAIMED':
        return 'Réclamé';

      case 'RETURNED':
        return 'Rendu';

      case 'CLOSED':
        return 'Fermé';

      default:
        return this.item.status;
    }

  }

}