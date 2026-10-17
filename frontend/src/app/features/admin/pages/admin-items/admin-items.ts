import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Item } from '../../../../core/models/item.model';
import { AdminService } from '../../../../core/services/admin';

@Component({ selector:'app-admin-items', imports:[FormsModule], templateUrl:'./admin-items.html', styleUrl:'./admin-items.scss' })
export class AdminItems {
  items: Item[] = [];
  search = '';
  editingId: number | null = null;
  loading = true;
  errorMessage = '';

  constructor(private readonly admin: AdminService, private readonly changeDetector: ChangeDetectorRef) { this.loadItems(); }

  loadItems(): void {
    this.loading = true;
    this.admin.getItems().subscribe({
      next: response => {
        this.items = response.data;
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

  get filteredItems(): Item[] { const q=this.search.trim().toLowerCase(); return !q ? this.items : this.items.filter(i => `${i.title} ${i.governorate} ${i.delegation} ${i.author?.name ?? ''}`.toLowerCase().includes(q)); }
  edit(id:number):void { this.editingId=id; }
  save(item: Item): void {
    this.admin.updateItem(item.id, { title: item.title, status: item.status }).subscribe({
      next: updated => {
        Object.assign(item, updated);
        this.editingId = null;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible d’enregistrer les modifications.';
        this.changeDetector.markForCheck();
      },
    });
  }
  close(item:Item):void { this.setStatus(item, 'CLOSED'); }
  reopen(item:Item):void { this.setStatus(item, 'ACTIVE'); }
  remove(id:number):void {
    if (confirm('Supprimer définitivement cette annonce ?')) {
      this.admin.deleteItem(id).subscribe({
        next: () => {
          this.items = this.items.filter(item => item.id !== id);
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Impossible de supprimer cette annonce.';
          this.changeDetector.markForCheck();
        },
      });
    }
  }

  private setStatus(item: Item, status: Item['status']): void {
    this.admin.updateItem(item.id, { status }).subscribe({
      next: updated => {
        Object.assign(item, updated);
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de modifier le statut.';
        this.changeDetector.markForCheck();
      },
    });
  }
}
