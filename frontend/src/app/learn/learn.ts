import { Component, OnInit, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestionService } from '../services/question';
import { Question } from '../models/question.model';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';

hljs.registerLanguage('typescript', typescript);

@Component({
  selector: 'app-learn',
  imports: [CommonModule, FormsModule],
  templateUrl: './learn.html',
  styleUrl: './learn.css',
})
export class Learn implements OnInit, AfterViewChecked {
  currentQuestion: Question | null = null;
  answerResult: { answer: string } | null = null;
  showAnswer = false;
  error: string | null = null;
  isLoading = false;
  private questionHighlightApplied = false;
  private answerHighlightApplied = false;

  constructor(
    private questionService: QuestionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadRandomQuestion();
  }

  ngAfterViewChecked() {
    // Highlight code in question text when question is loaded
    if (this.currentQuestion && !this.questionHighlightApplied) {
      const questionPre = document.querySelectorAll('h2.question > pre');
      if (questionPre.length > 0) {
        setTimeout(() => {
          questionPre.forEach((block) => {
            if (!block.classList.contains('hljs')) {
              block.classList.add('language-typescript');
              hljs.highlightElement(block as HTMLElement);
            }
          });
          this.questionHighlightApplied = true;
        }, 100);
      }
    }
    
    // Highlight code in answer when answer is revealed
    if (this.showAnswer && !this.answerHighlightApplied) {
      setTimeout(() => {
        document.querySelectorAll('.answer pre').forEach((block) => {
          if (!block.classList.contains('hljs')) {
            block.classList.add('hljs');
            block.classList.add('language-typescript');
            hljs.highlightElement(block as HTMLElement);
          }
        });
        this.answerHighlightApplied = true;
      }, 0);
    }
  }

  loadRandomQuestion() {
    this.error = null;
    this.isLoading = true;
    this.questionHighlightApplied = false;
    this.answerHighlightApplied = false;

    this.questionService.getRandomQuestion().subscribe({
      next: (question) => {
        this.currentQuestion = question;
        this.showAnswer = false;
        this.answerResult = null;
        this.isLoading = false;
        this.cdr.detectChanges();
        // Apply syntax highlighting to question code
        setTimeout(() => {
          document.querySelectorAll('h2.question > pre').forEach((block) => {
            if (!block.classList.contains('hljs')) {
              block.classList.add('hljs'); // Add class first for visibility
              block.classList.add('language-typescript');
              hljs.highlightElement(block as HTMLElement);
            }
          });
          this.questionHighlightApplied = true;
        }, 0);
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
    this.answerHighlightApplied = false;
    this.questionService.getAnswer(this.currentQuestion.id).subscribe({
      next: (result) => {
        // Replace &nbsp; with regular spaces to allow proper word wrapping
        const cleanedAnswer = result.answer.replace(/&nbsp;/g, ' ');
        this.answerResult = { answer: cleanedAnswer };
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
