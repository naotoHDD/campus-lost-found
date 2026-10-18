import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, ReferenceDataService } from '../../../../core/services/reference-data';

@Component({
  selector: 'app-admin-categories',
  imports: [FormsModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.scss',
})
export class AdminCategories {
  categories: Category[] = [];
  newCategory = '';
  editingId?: number;
  editingName = '';
  busyId?: number;
  adding = false;
  loading = true;
  errorMessage = '';

  constructor(
    private readonly referenceData: ReferenceDataService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.errorMessage = '';
    this.referenceData.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de charger les catégories.';
        this.changeDetector.markForCheck();
      },
    });
  }

  add(): void {
    const name = this.newCategory.trim();
    if (!name || this.adding) return;

    this.adding = true;
    this.errorMessage = '';
    this.referenceData.createCategory(name).subscribe({
      next: (category) => {
        this.categories = [...this.categories, category].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        this.newCategory = '';
        this.adding = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.adding = false;
        this.errorMessage =
          'Impossible d’ajouter cette catégorie. Vérifiez qu’elle n’existe pas déjà.';
        this.changeDetector.markForCheck();
      },
    });
  }

  startEdit(category: Category): void {
    this.editingId = category.id;
    this.editingName = category.name;
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.editingId = undefined;
    this.editingName = '';
  }

  save(category: Category): void {
    const name = this.editingName.trim();
    if (!name || this.busyId !== undefined) return;

    this.busyId = category.id;
    this.errorMessage = '';
    this.referenceData.updateCategory(category.id, name).subscribe({
      next: (updated) => {
        this.categories = this.categories
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => a.name.localeCompare(b.name));
        this.busyId = undefined;
        this.cancelEdit();
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.busyId = undefined;
        this.errorMessage =
          'Impossible de renommer cette catégorie. Le nom est peut-être déjà utilisé.';
        this.changeDetector.markForCheck();
      },
    });
  }

  remove(category: Category): void {
    if (this.busyId !== undefined) return;

    this.busyId = category.id;
    this.errorMessage = '';
    this.referenceData.deleteCategory(category.id).subscribe({
      next: () => {
        this.categories = this.categories.filter((item) => item.id !== category.id);
        this.busyId = undefined;
        if (this.editingId === category.id) this.cancelEdit();
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.busyId = undefined;
        this.errorMessage =
          'Impossible de supprimer cette catégorie : elle est peut-être utilisée par une annonce.';
        this.changeDetector.markForCheck();
      },
    });
  }
}
