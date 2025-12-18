import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
export class AchievementsComponent implements OnInit {
  achievements: UserAchievement[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private achievementsService: AchievementsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAchievements();
  }

  loadAchievements(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.error = 'Failed to load user';
      this.loading = false;
      return;
    }

    this.achievementsService.getUserAchievements(user.id).subscribe({
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