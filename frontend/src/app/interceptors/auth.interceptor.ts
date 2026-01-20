import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned).pipe(
      catchError((error) => {
        // Only auto-logout on 401 from auth endpoints to avoid
        // logging out due to unrelated service responses
        const url = (error?.url || req.url) as string;
        if (error.status === 401 && url.includes('/api/auth/')) {
          authService.logout();
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};
