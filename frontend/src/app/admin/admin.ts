import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin';
import { QuestionService } from '../services/question';
import { CreateQuestion } from '../models/question.model';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  question: CreateQuestion = {
    questionType: 'single_choice',
    questionText: '',
    longAnswer: '',
    difficulty: 'medium',
    topic: '',
    isActive: false
  };
  
  allTopics: string[] = [];
  successMessage = '';
  errorMessage = '';

  constructor(
    private adminService: AdminService,
    private questionService: QuestionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTopics();
  }

  loadTopics(): void {
    this.questionService.getAllQuestions().subscribe({
      next: (questions) => {
        const topicsSet = new Set<string>();
        questions.forEach(q => {
          if (q.topic) {
            topicsSet.add(q.topic);
          }
        });
        this.allTopics = Array.from(topicsSet).sort();
      },
      error: () => {
        this.allTopics = [];
      }
    });
  }

  onSubmit(): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.adminService.createQuestion(this.question).subscribe({
      next: (createdQuestion: any) => {
        this.successMessage = `Question created successfully! ID: ${createdQuestion.id}`;
        // Reset form
        this.question = {
          questionType: 'single_choice',
          questionText: '',
          longAnswer: '',
          difficulty: 'medium',
          topic: '',
          isActive: false
        };
      },
      error: (error: any) => {
        this.errorMessage = `Failed to create question: ${error.message}`;
      }
    });
  }

  goToQuestions(): void {
    this.router.navigate(['/questions']);
  }
}
