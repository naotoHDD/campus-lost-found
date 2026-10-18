import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LocationRecord, ReferenceDataService } from '../../../../core/services/reference-data';
import { AdminLocations } from './admin-locations';

class FakeReferenceDataService {
  updated?: { id: number; location: Partial<LocationRecord> };

  getLocations() {
    return of([
      {
        id: 1,
        governorate: 'Tunis',
        delegation: 'La Marsa',
        locality: 'Gammarth',
        addressText: 'Porte principale',
      },
    ]);
  }

  getGovernorates() {
    return of(['Ariana', 'Tunis']);
  }

  createLocation(location: Omit<LocationRecord, 'id'>) {
    return of({ id: 2, ...location });
  }

  updateLocation(id: number, location: Partial<LocationRecord>) {
    this.updated = { id, location };
    return of({ id, ...location } as LocationRecord);
  }

  deleteLocation() {
    return of({ success: true });
  }
}

describe('AdminLocations', () => {
  let component: AdminLocations;
  let fixture: ComponentFixture<AdminLocations>;
  let service: FakeReferenceDataService;

  beforeEach(async () => {
    service = new FakeReferenceDataService();
    await TestBed.configureTestingModule({
      imports: [AdminLocations],
      providers: [{ provide: ReferenceDataService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLocations);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads locations and governorates', () => {
    expect(component.locations).toHaveLength(1);
    expect(component.governorates).toContain('Tunis');
  });

  it('updates every editable location field', () => {
    component.startEdit(component.locations[0]);
    component.editDraft.delegation = 'Carthage';
    component.editDraft.locality = 'Byrsa';
    component.save(component.locations[0]);

    expect(service.updated).toEqual({
      id: 1,
      location: {
        governorate: 'Tunis',
        delegation: 'Carthage',
        locality: 'Byrsa',
        addressText: 'Porte principale',
      },
    });
    expect(component.locations[0].delegation).toBe('Carthage');
  });
});
