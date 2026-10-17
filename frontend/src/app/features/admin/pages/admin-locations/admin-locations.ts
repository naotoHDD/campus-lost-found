import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocationRecord, ReferenceDataService } from '../../../../core/services/reference-data';
@Component({selector:'app-admin-locations',imports:[FormsModule],templateUrl:'./admin-locations.html',styleUrl:'./admin-locations.scss'})
export class AdminLocations {
  locations: LocationRecord[] = [];
  governorates: string[] = [];
  governorate = '';
  delegation = '';
  locality = '';
  addressText = '';
  errorMessage = '';

  constructor(private readonly referenceData: ReferenceDataService, private readonly changeDetector: ChangeDetectorRef) {
    this.loadLocations();
    this.referenceData.getGovernorates().subscribe({
      next: governorates => {
        this.governorates = governorates;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les gouvernorats.';
        this.changeDetector.markForCheck();
      },
    });
  }

  loadLocations(): void {
    this.referenceData.getLocations().subscribe({
      next: locations => {
        this.locations = locations;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les localisations.';
        this.changeDetector.markForCheck();
      },
    });
  }

  add(): void {
    if (!this.governorate || !this.delegation.trim()) return;
    this.referenceData.createLocation({
      governorate: this.governorate,
      delegation: this.delegation.trim(),
      locality: this.locality.trim() || undefined,
      addressText: this.addressText.trim() || undefined,
    }).subscribe({
      next: location => {
        this.locations = [location, ...this.locations.filter(item => item.id !== location.id)];
        this.delegation = '';
        this.locality = '';
        this.addressText = '';
        this.errorMessage = '';
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible d’ajouter cette localisation.';
        this.changeDetector.markForCheck();
      },
    });
  }

  remove(location: LocationRecord): void {
    this.referenceData.deleteLocation(location.id).subscribe({
      next: () => {
        this.locations = this.locations.filter(item => item.id !== location.id);
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de supprimer cette localisation. Elle est peut-être utilisée.';
        this.changeDetector.markForCheck();
      },
    });
  }
}
