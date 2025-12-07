import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { QuestionService } from '../services/question';
import { Question } from '../models/question.model';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';

hljs.registerLanguage('typescript', typescript);

@Component({
  selector: 'app-questions',
  imports: [CommonModule, FormsModule, RouterModule],
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
  singleQuestionMode = false;

  constructor(
    private questionService: QuestionService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if a specific question ID is provided in route params
    this.route.paramMap.subscribe(params => {
      const questionId = params.get('id');
      if (questionId) {
        this.loadSpecificQuestion(+questionId);
      } else {
        this.loadQuestions();
      }
    });
  }

  loadSpecificQuestion(questionId: number) {
    this.loading = true;
    this.error = null;
    this.singleQuestionMode = true;

    this.questionService.getQuestionById(questionId).subscribe({
      next: (question: Question) => {
        const cleanedQuestion = {
          ...question,
          question: question.question.replace(/&nbsp;/g, ' ')
        };
        this.allQuestions = [cleanedQuestion];
        this.questions = [cleanedQuestion];
        this.loading = false;
        this.cdr.detectChanges();
        // Apply syntax highlighting
        setTimeout(() => {
          document.querySelectorAll('.question-text pre').forEach((block) => {
            if (!block.classList.contains('hljs')) {
              block.classList.add('hljs');
              block.classList.add('language-typescript');
              hljs.highlightElement(block as HTMLElement);
            }
          });
        }, 0);
      },
      error: (err: any) => {
        this.error = 'Failed to load question.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error loading question:', err);
      }
    });
  }

  loadQuestions() {
    this.loading = true;
    this.error = null;
    this.singleQuestionMode = false;

    this.questionService.getAllQuestions().subscribe({
      next: (questions) => {
        // Replace &nbsp; with regular spaces to allow proper word wrapping
        const cleanedQuestions = questions.map(q => ({
          ...q,
          question: q.question.replace(/&nbsp;/g, ' ')
        }));
        // Sort by ID descending to show newest first
        const sortedQuestions = cleanedQuestions.sort((a, b) => b.id - a.id);
        this.allQuestions = sortedQuestions;
        this.questions = sortedQuestions;
        this.extractTopics(sortedQuestions);
        this.loading = false;
        this.cdr.detectChanges();
        // Apply syntax highlighting to question code blocks
        setTimeout(() => {
          document.querySelectorAll('.question-text pre').forEach((block) => {
            if (!block.classList.contains('hljs')) {
              block.classList.add('hljs');
              block.classList.add('language-typescript');
              hljs.highlightElement(block as HTMLElement);
            }
          });
        }, 0);
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
        q.question.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (q.topic && q.topic.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesDifficulty = !this.selectedDifficulty || 
        q.difficulty === this.selectedDifficulty;

      const matchesTopic = !this.selectedTopic ||
        q.topic === this.selectedTopic;

      return matchesSearch && matchesDifficulty && matchesTopic;
    });
    // Reapply syntax highlighting after filtering
    this.cdr.detectChanges();
    setTimeout(() => {
      document.querySelectorAll('.question-text pre').forEach((block) => {
        if (!block.classList.contains('hljs')) {
          block.classList.add('hljs');
          block.classList.add('language-typescript');
          hljs.highlightElement(block as HTMLElement);
        }
      });
    }, 0);
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
            // Apply syntax highlighting to answer code blocks
            setTimeout(() => {
              document.querySelectorAll('.answer-text pre').forEach((block) => {
                if (!block.classList.contains('hljs')) {
                  block.classList.add('hljs');
                  block.classList.add('language-typescript');
                  hljs.highlightElement(block as HTMLElement);
                }
              });
            }, 0);
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

  backToAllQuestions() {
    this.router.navigate(['/questions']);
  }

  openInQuiz(questionId: number) {
    this.router.navigate(['/quiz'], { queryParams: { id: questionId } });
  }

  viewQuestion(questionId: number) {
    this.router.navigate(['/questions', questionId]);
  }
}
