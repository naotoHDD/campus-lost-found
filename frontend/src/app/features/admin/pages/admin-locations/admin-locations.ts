import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocationRecord, ReferenceDataService } from '../../../../core/services/reference-data';

interface LocationDraft {
  governorate: string;
  delegation: string;
  locality: string;
  addressText: string;
}

@Component({
  selector: 'app-admin-locations',
  imports: [FormsModule],
  templateUrl: './admin-locations.html',
  styleUrl: './admin-locations.scss',
})
export class AdminLocations {
  locations: LocationRecord[] = [];
  governorates: string[] = [];
  governorate = '';
  delegation = '';
  locality = '';
  addressText = '';
  editingId?: number;
  editDraft: LocationDraft = this.emptyDraft();
  busyId?: number;
  adding = false;
  loading = true;
  errorMessage = '';

  constructor(
    private readonly referenceData: ReferenceDataService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {
    this.loadLocations();
    this.referenceData.getGovernorates().subscribe({
      next: (governorates) => {
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
    this.loading = true;
    this.referenceData.getLocations().subscribe({
      next: (locations) => {
        this.locations = this.sortLocations(locations);
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de charger les localisations.';
        this.changeDetector.markForCheck();
      },
    });
  }

  add(): void {
    if (!this.governorate || !this.delegation.trim() || this.adding) return;

    this.adding = true;
    this.errorMessage = '';
    this.referenceData
      .createLocation({
        governorate: this.governorate,
        delegation: this.delegation.trim(),
        locality: this.locality.trim() || undefined,
        addressText: this.addressText.trim() || undefined,
      })
      .subscribe({
        next: (location) => {
          this.locations = this.sortLocations([
            location,
            ...this.locations.filter((item) => item.id !== location.id),
          ]);
          this.governorate = '';
          this.delegation = '';
          this.locality = '';
          this.addressText = '';
          this.adding = false;
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.adding = false;
          this.errorMessage =
            'Impossible d’ajouter cette localisation. Elle existe peut-être déjà.';
          this.changeDetector.markForCheck();
        },
      });
  }

  startEdit(location: LocationRecord): void {
    this.editingId = location.id;
    this.editDraft = {
      governorate: location.governorate,
      delegation: location.delegation,
      locality: location.locality ?? '',
      addressText: location.addressText ?? '',
    };
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.editingId = undefined;
    this.editDraft = this.emptyDraft();
  }

  save(location: LocationRecord): void {
    if (
      !this.editDraft.governorate ||
      !this.editDraft.delegation.trim() ||
      this.busyId !== undefined
    )
      return;

    this.busyId = location.id;
    this.errorMessage = '';
    this.referenceData
      .updateLocation(location.id, {
        governorate: this.editDraft.governorate,
        delegation: this.editDraft.delegation.trim(),
        locality: this.editDraft.locality.trim() || null,
        addressText: this.editDraft.addressText.trim() || null,
      })
      .subscribe({
        next: (updated) => {
          this.locations = this.sortLocations(
            this.locations.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.busyId = undefined;
          this.cancelEdit();
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.busyId = undefined;
          this.errorMessage =
            'Impossible de modifier cette localisation. Ces valeurs sont peut-être déjà utilisées.';
          this.changeDetector.markForCheck();
        },
      });
  }

  remove(location: LocationRecord): void {
    if (this.busyId !== undefined) return;

    this.busyId = location.id;
    this.errorMessage = '';
    this.referenceData.deleteLocation(location.id).subscribe({
      next: () => {
        this.locations = this.locations.filter((item) => item.id !== location.id);
        this.busyId = undefined;
        if (this.editingId === location.id) this.cancelEdit();
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.busyId = undefined;
        this.errorMessage =
          'Impossible de supprimer cette localisation : elle est peut-être utilisée par une annonce.';
        this.changeDetector.markForCheck();
      },
    });
  }

  private emptyDraft(): LocationDraft {
    return { governorate: '', delegation: '', locality: '', addressText: '' };
  }

  private sortLocations(locations: LocationRecord[]): LocationRecord[] {
    return [...locations].sort((a, b) =>
      `${a.governorate} ${a.delegation}`.localeCompare(`${b.governorate} ${b.delegation}`),
    );
  }
}
