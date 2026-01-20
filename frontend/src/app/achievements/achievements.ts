import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AchievementsService, UserAchievement } from '../services/achievements.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './achievements.html',
  styleUrls: ['./achievements.css']
})
export class AchievementsComponent implements OnInit, OnDestroy {
  achievements: UserAchievement[] = [];
  loading = true;
  error: string | null = null;
  private userSub: any;

  constructor(
    private achievementsService: AchievementsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // React to user changes so we reload achievements after login/logout
    this.userSub = this.authService.user$.subscribe(user => {
      if (user) {
        this.loading = true;
        this.error = null;
        this.loadAchievementsForUser(user.id);
      } else {
        this.achievements = [];
        this.loading = false;
        this.error = 'Failed to load user';
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe?.();
    }
  }

  private loadAchievementsForUser(userId: number): void {
    this.achievementsService.getUserAchievements(userId).subscribe({
      next: (data) => {
        this.achievements = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading achievements:', err);
        this.error = 'Failed to load achievements: ' + (err.message || err.status);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getBackgroundPosition(col: number, row: number): string {
    const x = col * -80;
    const y = row * -80;
    return `${x}px ${y}px`;
  }

  getProgressPercentage(progress: { current: number; total: number } | undefined): number {
    if (!progress) return 0;
    return Math.round((progress.current / progress.total) * 100);
  }
}