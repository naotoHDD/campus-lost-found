import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ItemCard } from '../../../../shared/components/item-card/item-card';
import { Item } from '../../../../core/models/item.model';
import { ItemService } from '../../../../core/services/item';
import { ReferenceDataService } from '../../../../core/services/reference-data';

@Component({ selector: 'app-home', imports: [RouterLink, ItemCard], templateUrl: './home.html', styleUrl: './home.scss' })
export class Home {
	recentItems: Item[] = [];
	governorateCount = 0;
	loading = true;
	errorMessage = '';

	constructor(itemService: ItemService, referenceData: ReferenceDataService, changeDetector: ChangeDetectorRef) {
		itemService.getItems({ type: 'FOUND', limit: 3 }).subscribe({
			next: response => {
				this.recentItems = response.data;
				this.loading = false;
				changeDetector.markForCheck();
			},
			error: () => {
				this.errorMessage = 'Impossible de charger les annonces.';
				this.loading = false;
				changeDetector.markForCheck();
			},
		});
		referenceData.getGovernorates().subscribe({
			next: governorates => {
				this.governorateCount = governorates.length;
				changeDetector.markForCheck();
			},
		});
	}
}
