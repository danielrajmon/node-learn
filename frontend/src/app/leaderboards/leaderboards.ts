import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService, LeaderboardEntry } from '../services/leaderboard.service';
import { QuizService } from '../services/quiz.service';
import { AuthService } from '../services/auth.service';

interface QuizMode {
  id: string;
  name: string;
  description: string;
  filters: any;
}

interface LeaderboardMode {
  mode: QuizMode;
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-leaderboards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboards.html',
  styleUrl: './leaderboards.css',
  changeDetection: ChangeDetectionStrategy.Default
})
export class LeaderboardsComponent implements OnInit {
  quizModes: QuizMode[] = [];
  leaderboards: LeaderboardMode[] = [];
  modesLoading = true;
  currentUserId: number | null = null;

  constructor(
    private leaderboardService: LeaderboardService,
    private quizService: QuizService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
    }

    this.quizService.loadQuizModes().subscribe({
      next: (modes) => {
        // Filter out 'missed' mode as it doesn't make sense for leaderboards
        this.quizModes = modes.filter(mode => mode.id !== 'missed');
        this.modesLoading = false;
        this.loadAllLeaderboards();
      },
      error: (err) => {
        this.modesLoading = false;
      }
    });
  }

  loadAllLeaderboards(): void {
    this.quizModes.forEach(mode => {
      const leaderboardMode: LeaderboardMode = {
        mode,
        entries: [],
        loading: true,
        error: null
      };
      this.leaderboards.push(leaderboardMode);

      this.leaderboardService.getLeaderboard(mode.id).subscribe({
        next: (entries) => {
          const idx = this.leaderboards.findIndex(lb => lb.mode.id === mode.id);
          if (idx >= 0) {
            this.leaderboards[idx].entries = entries;
            this.leaderboards[idx].loading = false;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          const idx = this.leaderboards.findIndex(lb => lb.mode.id === mode.id);
          if (idx >= 0) {
            this.leaderboards[idx].error = 'Failed to load leaderboard';
            this.leaderboards[idx].loading = false;
            this.cdr.markForCheck();
          }
        }
      });
    });
  }

  getMedalIcon(position: number): string {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '•';
    }
  }

  isRealUser(entry: LeaderboardEntry): boolean {
    // Show bold for real users (user_id > 0) or current user
    return entry.user_id > 0 || entry.user_id === this.currentUserId;
  }

  getLeaderboardModes(): LeaderboardMode[] {
    return this.leaderboards;
  }
}
