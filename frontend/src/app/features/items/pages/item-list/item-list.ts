import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ItemCard } from '../../../../shared/components/item-card/item-card';
import { Item } from '../../../../core/models/item.model';
import { ItemService } from '../../../../core/services/item';
import { ReferenceDataService } from '../../../../core/services/reference-data';

@Component({ selector: 'app-item-list', imports: [FormsModule, ItemCard], templateUrl: './item-list.html', styleUrl: './item-list.scss' })
export class ItemList {
  items: Item[] = [];
  categories: string[] = [];
  governorates: string[] = [];
  searchTerm = '';
  typeFilter = '';
  categoryFilter = '';
  governorateFilter = '';
  delegationFilter = '';
  sort = 'recent';
  currentPage = 1;
  pageSize = 6;
  totalItems = 0;
  totalPages = 1;
  loading = true;
  errorMessage = '';

  constructor(
    private readonly itemService: ItemService,
    private readonly referenceData: ReferenceDataService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {
    this.loadItems();
    this.referenceData.getCategories().subscribe({
      next: categories => {
        this.categories = categories.map(category => category.name);
        this.changeDetector.markForCheck();
      },
    });
    this.referenceData.getGovernorates().subscribe({
      next: governorates => {
        this.governorates = governorates;
        this.changeDetector.markForCheck();
      },
    });
  }

  get pagedItems(): Item[] { return this.items; }

  loadItems(): void {
    this.loading = true;
    this.errorMessage = '';
    this.itemService.getItems({
      search: this.searchTerm.trim() || undefined,
      type: this.typeFilter || undefined,
      category: this.categoryFilter || undefined,
      governorate: this.governorateFilter || undefined,
      delegation: this.delegationFilter.trim() || undefined,
      page: this.currentPage,
      limit: this.pageSize,
      sort: this.sort === 'old' ? 'oldest' : 'recent',
    }).subscribe({
      next: response => {
        this.items = response.data;
        this.totalItems = response.meta.total;
        this.totalPages = response.meta.totalPages;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les annonces.';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  changeFilters(): void {
    this.currentPage = 1;
    this.loadItems();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadItems();
    }
  }
}
