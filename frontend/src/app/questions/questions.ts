import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestionService } from '../services/question';
import { Question } from '../models/question.model';

@Component({
  selector: 'app-questions',
  imports: [CommonModule, FormsModule],
  templateUrl: './questions.html',
  styleUrl: './questions.css'
})
export class Questions implements OnInit {
  questions: Question[] = [];
  allQuestions: Question[] = [];
  allTopics: string[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';
  selectedDifficulty = '';
  selectedTopic = '';
  visibleAnswers = new Set<number>();
  answers = new Map<number, string>();

  constructor(
    private questionService: QuestionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.loading = true;
    this.error = null;

    this.questionService.getAllQuestions().subscribe({
      next: (questions) => {
        this.allQuestions = questions;
        this.questions = questions;
        this.extractTopics(questions);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load questions.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error loading questions:', err);
      }
    });
  }

  extractTopics(questions: Question[]) {
    const topicsSet = new Set<string>();
    questions.forEach(q => {
      if (q.topic) {
        topicsSet.add(q.topic);
      }
    });
    this.allTopics = Array.from(topicsSet).sort();
  }

  applyFilters() {
    this.questions = this.allQuestions.filter(q => {
      const matchesSearch = !this.searchTerm || 
        q.questionText.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (q.topic && q.topic.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesDifficulty = !this.selectedDifficulty || 
        q.difficulty === this.selectedDifficulty;

      const matchesTopic = !this.selectedTopic ||
        q.topic === this.selectedTopic;

      return matchesSearch && matchesDifficulty && matchesTopic;
    });
  }

  toggleAnswer(questionId: number) {
    if (this.visibleAnswers.has(questionId)) {
      this.visibleAnswers.delete(questionId);
    } else {
      this.visibleAnswers.add(questionId);
      this.cdr.detectChanges();
      // Fetch answer if not already loaded
      if (!this.answers.has(questionId)) {
        this.questionService.getAnswer(questionId).subscribe({
          next: (result) => {
            // Replace &nbsp; with regular spaces to allow proper word wrapping
            const cleanedAnswer = result.answer.replace(/&nbsp;/g, ' ');
            this.answers.set(questionId, cleanedAnswer);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error fetching answer:', err);
          }
        });
      }
    }
  }

  trackByQuestionId(index: number, question: Question): number {
    return question.id;
  }

  getTopicCount(topic: string): number {
    return this.allQuestions.filter(q => q.topic === topic).length;
  }

  getDifficultyCount(difficulty: string): number {
    return this.allQuestions.filter(q => q.difficulty === difficulty).length;
  }
}
