import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReferenceDataService } from '../../../../core/services/reference-data';
import { AdminCategories } from './admin-categories';

class FakeReferenceDataService {
  updated?: { id: number; name: string };

  getCategories() {
    return of([{ id: 1, name: 'Documents', slug: 'documents' }]);
  }

  createCategory(name: string) {
    return of({ id: 2, name, slug: name.toLowerCase() });
  }

  updateCategory(id: number, name: string) {
    this.updated = { id, name };
    return of({ id, name, slug: name.toLowerCase().replace(/\s+/g, '-') });
  }

  deleteCategory() {
    return of({ success: true });
  }
}

describe('AdminCategories', () => {
  let component: AdminCategories;
  let fixture: ComponentFixture<AdminCategories>;
  let service: FakeReferenceDataService;

  beforeEach(async () => {
    service = new FakeReferenceDataService();
    await TestBed.configureTestingModule({
      imports: [AdminCategories],
      providers: [{ provide: ReferenceDataService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCategories);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads categories', () => {
    expect(component.categories).toHaveLength(1);
  });

  it('renames a category through the PATCH service', () => {
    component.startEdit(component.categories[0]);
    component.editingName = 'Pièces d’identité';
    component.save(component.categories[0]);

    expect(service.updated).toEqual({ id: 1, name: 'Pièces d’identité' });
    expect(component.categories[0].name).toBe('Pièces d’identité');
    expect(component.editingId).toBeUndefined();
  });
});
