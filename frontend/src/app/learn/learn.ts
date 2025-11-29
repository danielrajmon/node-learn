import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionService } from '../services/question';
import { Question, AnswerResult } from '../models/question.model';

@Component({
  selector: 'app-learn',
  imports: [CommonModule],
  templateUrl: './learn.html',
  styleUrl: './learn.css',
})
export class Learn implements OnInit {
  currentQuestion: Question | null = null;
  answerResult: AnswerResult | null = null;
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
        this.error = 'Failed to load question. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  revealAnswer() {
    if (!this.currentQuestion) return;

    // Submit empty answer just to get the correct answer
    this.questionService.submitAnswer(this.currentQuestion.id, '').subscribe({
      next: (result) => {
        this.answerResult = result;
        this.showAnswer = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load answer. Please try again.';
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
