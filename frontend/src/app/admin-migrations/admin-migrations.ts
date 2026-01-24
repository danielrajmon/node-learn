import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../services/admin';

interface TableStatus {
  name: string;
  displayName: string;
  hasDmlData: boolean;
  loading: boolean;
}

@Component({
  selector: 'app-admin-migrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-migrations.html',
  styleUrl: './admin-migrations.css'
})
export class AdminMigrationsComponent implements OnInit {
  tables: TableStatus[] = [
    { name: 'choices', displayName: 'Choices', hasDmlData: false, loading: false },
    { name: 'leaderboards', displayName: 'Leaderboards', hasDmlData: false, loading: false },
    { name: 'questions', displayName: 'Questions', hasDmlData: false, loading: false },
    { name: 'userAchievements', displayName: 'User Achievements', hasDmlData: false, loading: false },
    { name: 'userQuestionStats', displayName: 'User Question Stats', hasDmlData: false, loading: false },
    { name: 'achievements', displayName: 'Achievements', hasDmlData: true, loading: false },
    { name: 'quizModes', displayName: 'Quiz Modes', hasDmlData: true, loading: false },
    { name: 'users', displayName: 'Users', hasDmlData: true, loading: false }
  ];

  initMessage = '';
  initError = '';

  exportLoading = false;
  importLoading = false;
  importMessage = '';
  importError = '';

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  getTableLabel(table: TableStatus): string {
    return table.name + (table.hasDmlData ? ' + data' : '');
  }

  initializeTable(table: TableStatus): void {
    if (!confirm(`Initialize ${table.displayName} table? This will create the table if it doesn't exist.`)) {
      return;
    }

    table.loading = true;
    this.initMessage = '';
    this.initError = '';

    this.adminService.initializeTable(table.name).subscribe({
      next: (response) => {
        this.initMessage = response.message;
        table.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.initMessage = '', 3000);
      },
      error: (error) => {
        this.initError = error?.error?.message || `Failed to initialize ${table.displayName}`;
        table.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.initError = '', 5000);
      }
    });
  }

  exportQuestions(): void {
    this.exportLoading = true;

    this.adminService.exportQuestions().subscribe({
      next: (questions) => {
        const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `questions-export-${Date.now()}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.exportLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        alert('Failed to export questions: ' + (error?.error?.message || error?.message));
        this.exportLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const questions = JSON.parse(e.target?.result as string);
        this.importQuestions(questions);
      } catch (error) {
        this.importError = 'Invalid JSON file';
        this.cdr.markForCheck();
      }
    };

    reader.readAsText(file);
  }

  private importQuestions(questions: any[]): void {
    if (!confirm(`Import ${questions.length} questions? This will add them to the database.`)) {
      return;
    }

    this.importLoading = true;
    this.importMessage = '';
    this.importError = '';

    this.adminService.importQuestions(questions).subscribe({
      next: (response) => {
        this.importMessage = response.message;
        this.importLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.importError = error?.error?.message || 'Failed to import questions';
        this.importLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
