import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestionService } from '../services/question';
import { Question } from '../models/question.model';

@Component({
  selector: 'app-learn',
  imports: [CommonModule, FormsModule],
  templateUrl: './learn.html',
  styleUrl: './learn.css',
})
export class Learn implements OnInit {
  currentQuestion: Question | null = null;
  answerResult: { answer: string } | null = null;
  showAnswer = false;
  error: string | null = null;
  isLoading = false;

  constructor(
    private questionService: QuestionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadRandomQuestion();
  }

  loadRandomQuestion() {
    this.error = null;
    this.isLoading = true;

    this.questionService.getRandomQuestion().subscribe({
      next: (question) => {
        this.currentQuestion = question;
        this.showAnswer = false;
        this.answerResult = null;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading question:', err);
        if (err.status === 404) {
          this.error = 'No questions found in database.';
        } else {
          this.error = 'Failed to load question. Please try again.';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  revealAnswer() {
    if (!this.currentQuestion) return;

    this.isLoading = true;
    this.questionService.getAnswer(this.currentQuestion.id).subscribe({
      next: (result) => {
        this.answerResult = { answer: result.answer };
        this.showAnswer = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load answer. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
        console.error('Error loading answer:', err);
      },
    });
  }

  nextQuestion() {
    this.loadRandomQuestion();
  }

  get canShowAnswer(): boolean {
    return !this.showAnswer && this.currentQuestion !== null && !this.isLoading;
  }

  get canGoNext(): boolean {
    return this.showAnswer && !this.isLoading;
  }
}
