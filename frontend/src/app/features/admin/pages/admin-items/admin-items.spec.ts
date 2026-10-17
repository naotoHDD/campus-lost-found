import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminItems } from './admin-items';

describe('AdminItems', () => {
  let component: AdminItems;
  let fixture: ComponentFixture<AdminItems>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminItems],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminItems);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
