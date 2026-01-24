import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminService } from '../services/admin';

interface AdminUser {
  id: number;
  email: string;
  name?: string;
  isAdmin: boolean;
  createdAt?: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  users: AdminUser[] = [];
  loading = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleAdminRole(user: AdminUser): void {
    this.adminService.updateUserRole(user.id, !user.isAdmin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          user.isAdmin = updatedUser.isAdmin;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to update user role';
          this.cdr.markForCheck();
        }
      });
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loading = false;
          const message = error?.error?.message || error?.message || 'Failed to load users';
          this.errorMessage = message;
          this.cdr.markForCheck();
        }
      });
  }
}
