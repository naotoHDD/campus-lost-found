import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { ItemService } from '../../../../core/services/item';
import { Category, ReferenceDataService } from '../../../../core/services/reference-data';
import { ItemCreate } from './item-create';

describe('ItemCreate', () => {
  let component: ItemCreate;
  let fixture: ComponentFixture<ItemCreate>;
  let categories: Subject<Category[]>;
  let governorates: Subject<string[]>;

  beforeEach(async () => {
    categories = new Subject<Category[]>();
    governorates = new Subject<string[]>();
    await TestBed.configureTestingModule({
      imports: [ItemCreate],
      providers: [
        provideRouter([]),
        { provide: ItemService, useValue: {} },
        { provide: ReferenceDataService, useValue: {
          getCategories: () => categories.asObservable(),
          getGovernorates: () => governorates.asObservable(),
        } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders categories and governorates when the reference data arrives asynchronously', async () => {
    categories.next([{ id: 1, name: 'Clés', slug: 'cles' }]);
    governorates.next(['Tunis']);
    await fixture.whenStable();
    fixture.detectChanges();

    const categoryOptions = Array.from(fixture.nativeElement.querySelectorAll('select[formControlName="category"] option')) as HTMLOptionElement[];
    expect(categoryOptions.map(option => option.textContent?.trim())).toContain('Clés');

    component.form.patchValue({ title: 'Keys', description: 'Found keys', category: 'Clés', itemDate: '2026-10-10' });
    component.nextStep();
    fixture.detectChanges();
    const governorateOptions = Array.from(fixture.nativeElement.querySelectorAll('select[formControlName="governorate"] option')) as HTMLOptionElement[];
    expect(governorateOptions.map(option => option.textContent?.trim())).toContain('Tunis');
  });
});
