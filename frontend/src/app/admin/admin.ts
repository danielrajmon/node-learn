import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin';
import { QuestionService } from '../services/question';
import { CreateQuestion, Question, Choice } from '../models/question.model';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule, QuillModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit, AfterViewInit {
  question: CreateQuestion = {
    questionType: 'single_choice',
    questionText: '',
    longAnswer: '',
    difficulty: 'medium',
    topic: '',
    isActive: false,
    matchKeywords: [],
    choices: []
  };
  
  allTopics: string[] = [];
  allQuestions: Question[] = [];
  editingQuestionId: number | null = null;
  isEditMode = false;
  loading = false;
  successMessage = '';
  errorMessage = '';

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link']
    ]
    // syntax module is intentionally omitted to disable highlight.js
  };

  constructor(
    private adminService: AdminService,
    private questionService: QuestionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadQuestions();
    this.initializeChoices();
    this.initializeKeywords();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.addTooltipsToQuillToolbar();
    }, 100);
  }

  addTooltipsToQuillToolbar(): void {
    const tooltips: { [key: string]: string } = {
      '.ql-bold': 'Bold',
      '.ql-italic': 'Italic',
      '.ql-underline': 'Underline',
      '.ql-strike': 'Strikethrough',
      '.ql-blockquote': 'Blockquote',
      '.ql-code-block': 'Code Block',
      '.ql-header[value="1"]': 'Heading 1',
      '.ql-header[value="2"]': 'Heading 2',
      '.ql-list[value="ordered"]': 'Numbered List',
      '.ql-list[value="bullet"]': 'Bullet List',
      '.ql-indent[value="-1"]': 'Decrease Indent',
      '.ql-indent[value="+1"]': 'Increase Indent',
      '.ql-link': 'Insert Link',
      '.ql-clean': 'Remove Formatting'
    };

    Object.keys(tooltips).forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(button => {
        button.setAttribute('title', tooltips[selector]);
      });
    });
  }

  loadQuestions(): void {
    this.loading = true;
    console.log('Loading questions from admin endpoint...');
    this.adminService.getAllQuestions().subscribe({
      next: (questions: Question[]) => {
        console.log('Received questions:', questions);
        this.allQuestions = questions;
        const topicsSet = new Set<string>();
        questions.forEach((q: Question) => {
          if (q.topic) {
            topicsSet.add(q.topic);
          }
        });
        this.allTopics = Array.from(topicsSet).sort();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading questions:', err);
        this.allQuestions = [];
        this.allTopics = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.isEditMode && this.editingQuestionId) {
      // Update existing question
      this.adminService.updateQuestion(this.editingQuestionId, this.question).subscribe({
        next: () => {
          this.successMessage = `Question updated successfully!`;
          this.resetForm();
          this.loadQuestions();
        },
        error: (error: any) => {
          this.errorMessage = `Failed to update question: ${error.message}`;
        }
      });
    } else {
      // Create new question
      this.adminService.createQuestion(this.question).subscribe({
        next: (createdQuestion: any) => {
          this.successMessage = `Question created successfully! ID: ${createdQuestion.id}`;
          this.resetForm();
          this.loadQuestions();
        },
        error: (error: any) => {
          this.errorMessage = `Failed to create question: ${error.message}`;
        }
      });
    }
  }

  editQuestion(q: Question): void {
    this.isEditMode = true;
    this.editingQuestionId = q.id;
    
    // If no choices exist for choice-based questions, initialize them
    let choices = q.choices && q.choices.length > 0 ? [...q.choices] : [];
    if (choices.length === 0) {
      if (q.questionType === 'single_choice') {
        // Initialize with 8 empty choices
        choices = Array(8).fill(null).map((_, i) => ({ choiceText: '', isGood: i === 0 }));
      } else if (q.questionType === 'multiple_choice') {
        // Initialize with 4 empty choices
        choices = Array(4).fill(null).map((_, i) => ({ choiceText: '', isGood: i === 0 }));
      }
    }
    
    this.question = {
      questionType: q.questionType,
      questionText: q.questionText,
      longAnswer: (q as any).longAnswer || '',
      difficulty: q.difficulty,
      topic: q.topic,
      isActive: q.isActive,
      matchKeywords: q.matchKeywords && q.matchKeywords.length > 0 ? [...q.matchKeywords] : (q.questionType === 'text_input' ? [''] : []),
      choices
    };
    this.successMessage = '';
    this.errorMessage = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteQuestion(id: number): void {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    this.adminService.deleteQuestion(id).subscribe({
      next: () => {
        this.successMessage = 'Question deleted successfully!';
        this.loadQuestions();
      },
      error: (error: any) => {
        this.errorMessage = `Failed to delete question: ${error.message}`;
      }
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.isEditMode = false;
    this.editingQuestionId = null;
    this.question = {
      questionType: 'single_choice',
      questionText: '',
      longAnswer: '',
      difficulty: 'medium',
      topic: '',
      isActive: false,
      matchKeywords: [],
      choices: []
    };
    this.initializeChoices();
    this.initializeKeywords();
  }

  onQuestionTypeChange(): void {
    this.initializeChoices();
    this.initializeKeywords();
  }

  initializeChoices(): void {
    if (this.question.questionType === 'single_choice') {
      // Single choice: 1 correct + 7 wrong = 8 total
      this.question.choices = [
        { choiceText: '', isGood: true },
        { choiceText: '', isGood: false },
        { choiceText: '', isGood: false },
        { choiceText: '', isGood: false },
        { choiceText: '', isGood: false },
        { choiceText: '', isGood: false },
        { choiceText: '', isGood: false },
        { choiceText: '', isGood: false }
      ];
    } else if (this.question.questionType === 'multiple_choice') {
      // Multiple choice: Start with 8 choices (1 correct + 7 wrong)
      this.question.choices = [
        { choiceText: '', isGood: true },
        { choiceText: '', isGood: false },
        { choiceText: '', isGood: false },
        { choiceText: '', isGood: false },
        { choiceText: '', isGood: false },
        { choiceText: '', isGood: false },
        { choiceText: '', isGood: false },
        { choiceText: '', isGood: false }
      ];
    } else {
      // Text input: no choices
      this.question.choices = [];
    }
  }

  initializeKeywords(): void {
    if (this.question.questionType === 'text_input') {
      // Start with 1 keyword field
      this.question.matchKeywords = [''];
    } else {
      this.question.matchKeywords = [];
    }
  }

  addChoice(): void {
    if (this.question.questionType === 'multiple_choice' || this.question.questionType === 'single_choice') {
      this.question.choices = this.question.choices || [];
      this.question.choices.push({ choiceText: '', isGood: false });
    }
  }

  removeChoice(index: number): void {
    if ((this.question.questionType === 'multiple_choice' || this.question.questionType === 'single_choice') && this.question.choices) {
      this.question.choices.splice(index, 1);
    }
  }

  getWrongChoicesCount(): number {
    return this.question.choices?.filter(c => !c.isGood).length || 0;
  }

  addKeyword(): void {
    if (this.question.questionType === 'text_input') {
      this.question.matchKeywords = this.question.matchKeywords || [];
      this.question.matchKeywords.push('');
    }
  }

  removeKeyword(index: number): void {
    if (this.question.questionType === 'text_input' && this.question.matchKeywords) {
      this.question.matchKeywords.splice(index, 1);
    }
  }

  goToQuestions(): void {
    this.router.navigate(['/questions']);
  }

  stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  trackByIndex(index: number): number {
    return index;
  }
}
