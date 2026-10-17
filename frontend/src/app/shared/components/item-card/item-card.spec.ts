import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ItemCard } from './item-card';

describe('ItemCard', () => {
  let component: ItemCard;
  let fixture: ComponentFixture<ItemCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemCard);
    component = fixture.componentInstance;
    component.item = {
      id: 1,
      title: 'Lost wallet',
      description: 'Black wallet',
      type: 'LOST',
      status: 'ACTIVE',
      category: { id: 1, name: 'Portefeuilles' },
      governorate: 'Tunis',
      delegation: 'La Marsa',
      itemDate: '2026-10-05T12:00:00.000Z',
      createdAt: '2026-10-05T12:00:00.000Z',
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.statusLabel).toBe('Actif');
  });
});
