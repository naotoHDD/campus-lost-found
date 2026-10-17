import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, ReferenceDataService } from '../../../../core/services/reference-data';

@Component({
  selector: 'app-admin-categories',
  imports: [
    FormsModule
  ],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.scss'
})
export class AdminCategories {

  categories: Category[] = [];

  newCategory = '';
  errorMessage = '';

  constructor(private readonly referenceData: ReferenceDataService, private readonly changeDetector: ChangeDetectorRef) {
    this.loadCategories();
  }

  loadCategories(): void {
    this.referenceData.getCategories().subscribe({
      next: categories => {
        this.categories = categories;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les catégories.';
        this.changeDetector.markForCheck();
      },
    });
  }

  add() {

    const name =
      this.newCategory.trim();

    if (!name) {
      return;
    }

    this.referenceData.createCategory(name).subscribe({
      next: category => {
        this.categories = [...this.categories, category].sort((a, b) => a.name.localeCompare(b.name));
        this.newCategory = '';
        this.errorMessage = '';
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible d’ajouter cette catégorie.';
        this.changeDetector.markForCheck();
      },
    });

  }

  remove(category: Category) {
    this.referenceData.deleteCategory(category.id).subscribe({
      next: () => {
        this.categories = this.categories.filter(item => item.id !== category.id);
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de supprimer cette catégorie. Elle est peut-être utilisée.';
        this.changeDetector.markForCheck();
      },
    });

  }

}