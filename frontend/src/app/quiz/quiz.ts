import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionService } from '../services/question';
import { Question, AnswerResult } from '../models/question.model';

@Component({
  selector: 'app-quiz',
  imports: [CommonModule],
  templateUrl: './quiz.html',
  styleUrl: './quiz.css',
})
export class Quiz implements OnInit {
  currentQuestion: Question | null = null;
  answerResult: AnswerResult | null = null;
  showAnswer = false;
  loading = false;
  error: string | null = null;

  constructor(
    private questionService: QuestionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadRandomQuestion();
  }

  loadRandomQuestion() {
    this.loading = true;
    this.error = null;
    this.showAnswer = false;
    this.answerResult = null;

    this.questionService.getRandomQuestion().subscribe({
      next: (question) => {
        this.currentQuestion = question;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading question:', err);
        this.error = 'Failed to load question. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  revealAnswer() {
    if (!this.currentQuestion) return;

    this.loading = true;
    // Submit empty answer just to get the correct answer
    this.questionService.submitAnswer(this.currentQuestion.id, '').subscribe({
      next: (result) => {
        this.answerResult = result;
        this.showAnswer = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load answer. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error loading answer:', err);
      },
    });
  }

  nextQuestion() {
    this.loadRandomQuestion();
  }

  get canShowAnswer(): boolean {
    return !this.showAnswer && !this.loading && this.currentQuestion !== null;
  }

  get canGoNext(): boolean {
    return this.showAnswer && !this.loading;
  }
}
