import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Item } from '../../../../core/models/item.model';
import { AuthService } from '../../../../core/services/auth';
import { ClaimService } from '../../../../core/services/claim';
import { ItemService } from '../../../../core/services/item';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

@Component({
  selector: 'app-create-claim',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-claim.html',
  styleUrl: './create-claim.scss',
})
export class CreateClaim {
  readonly itemId: number;
  item?: Item;
  selectedFile?: File;
  selectedFileName = '';
  loading = true;
  sending = false;
  isOwnItem = false;
  errorMessage = '';
  fileError = '';

  form = new FormGroup({
    proofText: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
    answer: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    route: ActivatedRoute,
    private readonly itemService: ItemService,
    private readonly claimService: ClaimService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {
    this.itemId = Number(route.snapshot.paramMap.get('itemId'));
    this.loadItem();
  }

  get canSubmit(): boolean {
    return !!this.item && this.item.status === 'ACTIVE' && !this.isOwnItem;
  }

  loadItem(): void {
    if (!Number.isInteger(this.itemId) || this.itemId <= 0) {
      this.loading = false;
      this.errorMessage = 'Cette annonce est invalide.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.itemService.getItem(this.itemId).subscribe({
      next: (item) => {
        this.item = item;
        this.isOwnItem = item.author?.id === this.authService.getCurrentUser()?.id;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de charger cette annonce. Réessayez dans un instant.';
        this.changeDetector.markForCheck();
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.fileError = '';
    this.selectedFile = undefined;
    this.selectedFileName = '';

    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      this.fileError = 'Format non accepté. Utilisez un fichier JPG, PNG ou PDF.';
      input.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.fileError = 'Le fichier dépasse la taille maximale de 5 Mo.';
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
  }

  submit(): void {
    if (this.form.invalid || !this.canSubmit || this.sending) {
      this.form.markAllAsTouched();
      return;
    }

    const data = new FormData();
    data.append('proofText', this.form.controls.proofText.value.trim());
    data.append('answer', this.form.controls.answer.value.trim());

    if (this.selectedFile) {
      data.append('file', this.selectedFile);
    }

    this.sending = true;
    this.errorMessage = '';
    this.claimService.createClaim(this.itemId, data).subscribe({
      next: () => this.router.navigate(['/my-claims']),
      error: (error: unknown) => {
        this.sending = false;
        this.errorMessage = this.getErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) return 'Vous avez déjà envoyé une réclamation pour cet objet.';
      if (error.status === 400)
        return 'Cette réclamation n’est pas valide ou l’objet n’est plus disponible.';
    }
    return 'Impossible d’envoyer la réclamation. Vérifiez votre connexion puis réessayez.';
  }
}
