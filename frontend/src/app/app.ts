import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from './services/auth.service';
import { QuizStateService } from './services/quiz-state.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  protected readonly mobileMenuOpen = signal(false);
  user: User | null = null;

  constructor(private authService: AuthService, private quizStateService: QuizStateService) {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  onQuizClick(): void {
    this.quizStateService.requestConfirmReset((confirmed) => {
      if (confirmed) {
        this.quizStateService.resetToModeSelection();
      }
    });
    this.closeMobileMenu();
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }

  isGuestUser(): boolean {
    return this.user?.id === 1 && this.user?.email === 'guest@node-learn.local';
  }
}
