import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemService } from '../../../../core/services/item';
import { ReferenceDataService } from '../../../../core/services/reference-data';
import { LocationPicker, SelectedPosition } from '../../../../shared/components/location-picker/location-picker';

@Component({
  selector: 'app-item-create',
  imports: [ReactiveFormsModule, LocationPicker],
  templateUrl: './item-create.html',
  styleUrl: './item-create.scss'
})
export class ItemCreate {
  step = 1;
  selectedFile?: File;
  previewUrl?: string;
  loading = false;
  errorMessage = '';
  governorates: string[] = [];
  categories: string[] = [];

  form = new FormGroup({
    type: new FormControl<'LOST' | 'FOUND'>('FOUND', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    itemDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    governorate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    delegation: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    locality: new FormControl('', { nonNullable: true }),
    addressText: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    latitude: new FormControl(36.8065, { nonNullable: true }),
    longitude: new FormControl(10.1815, { nonNullable: true }),
    verificationDetails: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    verificationQuestion: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor(
    private itemService: ItemService,
    private referenceData: ReferenceDataService,
    private router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {
    this.referenceData.getCategories().subscribe({
      next: categories => {
        this.categories = categories.map(category => category.name);
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les catégories.';
        this.changeDetector.markForCheck();
      },
    });
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

  nextStep(): void {
    const step1 = ['type', 'title', 'description', 'category', 'itemDate'];
    const step2 = ['governorate', 'delegation', 'addressText'];
    const names = this.step === 1 ? step1 : this.step === 2 ? step2 : [];
    for (const name of names) this.form.get(name)?.markAsTouched();
    if (names.some(name => this.form.get(name)?.invalid)) return;
    if (this.step < 3) this.step++;
  }

  previousStep(): void { if (this.step > 1) this.step--; }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
  }

  onPositionChange(position: SelectedPosition): void {
    this.form.controls.latitude.setValue(position.latitude);
    this.form.controls.longitude.setValue(position.longitude);
  }

  publish(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const values = this.form.getRawValue();
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => data.append(key, String(value ?? '')));
    if (this.selectedFile) data.append('image', this.selectedFile);
    this.loading = true;
    this.itemService.createItem(data).subscribe({
      next: item => this.router.navigate(['/items', item.id]),
      error: () => {
        this.loading = false;
        this.errorMessage = 'Publication impossible. Le backend NestJS doit être démarré.';
        this.changeDetector.markForCheck();
      }
    });
  }
}
