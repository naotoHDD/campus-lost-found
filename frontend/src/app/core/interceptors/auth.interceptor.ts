import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, EMPTY, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn =
  (req, next) => {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    const router = inject(Router);
    const token = browser ? localStorage.getItem('token') : null;

    const authenticatedRequest = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next(authenticatedRequest).pipe(
      catchError(error => {
        if (browser && token && error instanceof HttpErrorResponse && error.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('user');
          if (!req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
            void router.navigate(['/login']);
          }
          return EMPTY;
        }

        return throwError(() => error);
      }),
    );
  };