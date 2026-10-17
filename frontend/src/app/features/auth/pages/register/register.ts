import { ChangeDetectorRef, Component } from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../../../core/services/auth';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {

  loading = false;
  errorMessage = '';

  registerForm =
    new FormGroup({

      name:
        new FormControl(
          '',
          [
            Validators.required
          ]
        ),

      email:
        new FormControl(
          '',
          [
            Validators.required,
            Validators.email
          ]
        ),

      password:
        new FormControl(
          '',
          [
            Validators.required,
            Validators.minLength(6)
          ]
        )

    });

  constructor(
    private auth:
      AuthService,

    private router:
      Router,

    private readonly changeDetector:
      ChangeDetectorRef
  ) {}

  submit() {

    if (
      this.registerForm.invalid
    ) {
      return;
    }

    this.loading = true;

    this.auth
      .register({
        name:
          this.registerForm
            .value.name!,

        email:
          this.registerForm
            .value.email!,

        password:
          this.registerForm
            .value.password!
      })
      .subscribe({

        next:
          response => {

            this.auth
              .saveSession(
                response
              );

            this.router
              .navigate(['/']);

          },

        error:
          () => {

            this.loading =
              false;

            this.errorMessage =
              'Impossible de créer le compte.';

            this.changeDetector.markForCheck();

          }

      });

  }

}