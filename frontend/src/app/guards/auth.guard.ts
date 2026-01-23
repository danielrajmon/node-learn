import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Ensures user is authenticated before accessing protected routes
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    }
    // Redirect to login if not authenticated
    this.router.navigate(['/login']);
    return false;
  }
}

/**
 * Admin Guard - Ensures user is authenticated AND has admin role
 */
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();
    if (user?.isAdmin) {
      return true;
    }
    // Redirect to home if not admin
    this.router.navigate(['/']);
    return false;
  }
}
