import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface User {
  id: number;
  email: string;
  name: string;
  picture: string;
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.userSubject.next(JSON.parse(user));
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

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
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
