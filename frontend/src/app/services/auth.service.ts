import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export interface User {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
    // If a token exists, refresh the user profile to avoid stale user data
    const token = this.getToken();
    if (token) {
      const apiUrl = window.location.port === '4200'
        ? 'http://localhost:3000/api/auth/profile'
        : '/api/auth/profile';
      this.http.get<User>(apiUrl).subscribe({
        next: (user) => {
          localStorage.setItem('user', JSON.stringify(user));
          this.userSubject.next(user);
        },
        error: (err) => {
          // Only logout on explicit 401 from auth; otherwise keep current state
          if (err?.status === 401) {
            this.logout();
          }
          // else ignore transient/profile load errors on startup
        }
      });
    }
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.userSubject.next(JSON.parse(user));
    } else {
      // No user logged in - load guest user
      const guestUser: User = {
        id: 1,
        email: 'guest@node-learn.local',
        name: 'Guest User',
        isAdmin: false
      };
      this.userSubject.next(guestUser);
    }
  }

  login(): void {
    // Use relative URL to work in both Docker (port 80) and local dev (port 4200)
    const authUrl = window.location.port === '4200'
      ? 'http://localhost:3000/api/auth/google'
      : '/api/auth/google';
    window.location.href = authUrl;
  }

  handleCallback(token: string): void {
    localStorage.setItem('access_token', token);
    
    // Use relative URL to work in both Docker (port 80) and local dev (port 4200)
    const apiUrl = window.location.port === '4200' 
      ? 'http://localhost:3000/api/auth/profile'
      : '/api/auth/profile';
    
    this.http.get<User>(apiUrl).subscribe({
      next: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        this.userSubject.next(user);
      },
      error: (error) => {
        console.error('Failed to fetch user profile:', error);
        this.logout();
      }
    });
  }

  handleCallbackAsync(token: string): Promise<void> {
    localStorage.setItem('access_token', token);
    
    // Use relative URL to work in both Docker (port 80) and local dev (port 4200)
    const apiUrl = window.location.port === '4200' 
      ? 'http://localhost:3000/api/auth/profile'
      : '/api/auth/profile';
    
    return new Promise((resolve, reject) => {
      this.http.get<User>(apiUrl).subscribe({
        next: (user) => {
          localStorage.setItem('user', JSON.stringify(user));
          this.userSubject.next(user);
          resolve();
        },
        error: (error) => {
          console.error('Failed to fetch user profile:', error);
          if (error?.status === 401) {
            this.logout();
          }
          reject(error);
        }
      });
    });
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    // Load guest user after logout
    const guestUser: User = {
      id: 1,
      email: 'guest@node-learn.local',
      name: 'Guest User',
      isAdmin: false
    };
    this.userSubject.next(guestUser);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }
}
