import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../services/admin';

interface TableStatus {
  name: string;
  displayName: string;
  hasDmlData: boolean;
  loading: boolean;
  exists?: boolean;
  database?: string;
}

@Component({
  selector: 'app-admin-migrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-migrations.html',
  styleUrl: './admin-migrations.css'
})
export class AdminMigrationsComponent implements OnInit {
  exportLoading = false;
  importLoading = false;
  importMessage = '';
  importError = '';

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Component initialized
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
