import { ChangeDetectorRef, Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClaimService } from '../../../../core/services/claim';

@Component({
  selector: 'app-create-claim',
  imports: [ReactiveFormsModule],
  templateUrl: './create-claim.html',
  styleUrl: './create-claim.scss'
})
export class CreateClaim {
  itemId: number;
  selectedFile?: File;
  errorMessage = '';

  form = new FormGroup({
    proofText: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    answer: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  constructor(
    route: ActivatedRoute,
    private claimService: ClaimService,
    private router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {
    this.itemId = Number(route.snapshot.paramMap.get('itemId'));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.selectedFile = file;
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = new FormData();
    data.append('proofText', this.form.controls.proofText.value);
    data.append('answer', this.form.controls.answer.value);

    if (this.selectedFile) {
      data.append('file', this.selectedFile);
    }

    this.claimService.createClaim(this.itemId, data).subscribe({
      next: () => this.router.navigate(['/my-claims']),
      error: () => {
        this.errorMessage = 'Impossible d’envoyer la réclamation.';
        this.changeDetector.markForCheck();
      }
    });
  }
}
