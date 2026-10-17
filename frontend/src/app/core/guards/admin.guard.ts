import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn =
  () => {

    const router = inject(Router);
    const auth = inject(AuthService);

    if (
      auth.isLoggedIn() &&
      auth.isAdmin()
    ) {
      return true;
    }

    return router.createUrlTree([
      '/'
    ]);
  };