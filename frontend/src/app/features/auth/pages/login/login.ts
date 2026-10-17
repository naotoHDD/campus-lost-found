import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loading = false;
  errorMessage = '';

  loginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  constructor(private auth: AuthService, private router: Router, private readonly changeDetector: ChangeDetectorRef) {}

  submit(): void {
    if (this.loginForm.invalid) return;
    const { email, password } = this.loginForm.getRawValue();

    this.loading = true;
    this.errorMessage = '';
    this.auth.login({ email, password }).subscribe({
      next: response => {
        this.auth.saveSession(response);
        this.router.navigate([response.user.role === 'ADMIN' ? '/admin' : '/']);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Connexion impossible. Utilisez un compte backend ou un compte de démonstration.';
        this.changeDetector.markForCheck();
      }
    });
  }
}
