import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { StatsService, UserStatsResponse } from '../services/stats.service';
import { AuthService, User } from '../services/auth.service';

@Component({
  selector: 'app-stats',
  imports: [CommonModule, RouterModule],
  templateUrl: './stats.html',
  styleUrl: './stats.css'
})
export class StatsComponent implements OnInit {
  stats: UserStatsResponse | null = null;
  loading = false;
  error: string | null = null;
  currentUser: User | null = null;

  constructor(
    private statsService: StatsService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadStats(user.id);
      } else {
        this.error = 'Please log in to view your statistics.';
      }
    });
  }

  loadStats(userId: number) {
    this.loading = true;
    this.error = null;

    this.statsService.getUserStats(userId).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load statistics.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error loading stats:', err);
      }
    });
  }

  getDifficultyClass(difficulty: string): string {
    return difficulty.toLowerCase();
  }

  stripHtml(html: string): string {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  getQuestionPreview(question: string): string {
    // Extract just the first paragraph by looking for the first <p> tag
    const parser = new DOMParser();
    const doc = parser.parseFromString(question, 'text/html');
    const firstParagraph = doc.querySelector('p');
    
    if (firstParagraph) {
      const cleanText = firstParagraph.textContent || '';
      return cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText;
    }
    
    // Fallback to stripping all HTML and taking first 100 chars
    const cleanText = this.stripHtml(question);
    return cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText;
  }

  navigateToQuestion(questionId: number): void {
    this.router.navigate(['/questions', questionId], { queryParams: { from: 'stats' } });
  }
}
