import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { QuestionService, QuestionFilters } from '../services/question';
import { AuthService, User } from '../services/auth.service';
import { QuizStateService } from '../services/quiz-state.service';
import { Question, Choice } from '../models/question.model';
import { Subscription } from 'rxjs';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';

hljs.registerLanguage('typescript', typescript);

interface QuizChoice extends Choice {
  selected?: boolean;
  skipped?: boolean; // For correct answers that weren't displayed initially
}

interface QuizMode {
  id: string;
  name: string;
  description: string;
  filters: QuestionFilters;
}

@Component({
  selector: 'app-quiz',
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz.html',
  styleUrl: './quiz.css'
})
export class Quiz implements OnInit, OnDestroy {
  // Mode selection
  quizModes: QuizMode[] = [
    { id: 'random', name: 'Random', description: 'Random questions', filters: {} },
    { id: 'code', name: 'Code-Based', description: 'Code questions', filters: { practical: true } },
    { id: 'theory', name: 'Theoretical', description: 'Theoretical questions', filters: { practical: false } },
    { id: 'easy', name: 'Easy', description: 'Easy difficulty', filters: { difficulty: 'easy' } },
    { id: 'medium', name: 'Medium', description: 'Medium difficulty', filters: { difficulty: 'medium' } },
    { id: 'hard', name: 'Hard', description: 'Hard difficulty', filters: { difficulty: 'hard' } },
    { id: 'single', name: 'Single Choice', description: 'Single choice questions', filters: { questionType: 'single_choice' } },
    { id: 'multi', name: 'Multiple Choice', description: 'Multiple choice questions', filters: { questionType: 'multiple_choice' } },
    { id: 'text', name: 'Text Input', description: 'Text input questions', filters: { questionType: 'text_input' } },
    { id: 'missed', name: 'Missed', description: 'Questions you got wrong', filters: {} },
  ];
  selectedMode: QuizMode | null = null;
  showModeSelection = true;
  showLeaderboardToggle = true;
  leaderboardMode = false;
  streak = 0;
  maxStreak = 0;

  questions: Question[] = [];
  currentQuestionIndex = 0;
  currentQuestion: Question | null = null;
  displayChoices: QuizChoice[] = [];
  skippedCorrectChoices: QuizChoice[] = [];
  textAnswer = '';
  textAnswers: string[] = [];
  textAnswersCorrect: boolean[] = [];
  answered = false;
  submitting = false;
  correct = false;
  feedback = '';
  longAnswer = '';
  loading = false;
  error: string | null = null;
  answerHighlightApplied = false;
  currentUser: User | null = null;
  awardedAchievements: any[] = [];
  showAchievementNotification = false;
  currentAchievementIndex = 0;
  private resetSubscription: Subscription | null = null;

  constructor(
    private questionService: QuestionService,
    private authService: AuthService,
    private quizStateService: QuizStateService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  getAchievementBackgroundPosition(col: number, row: number): string {
    const x = col * -80;
    const y = row * -80;
    return `${x}px ${y}px`;
  }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Subscribe to reset signal from header Quiz click
    this.resetSubscription = this.quizStateService.resetToModeSelection$.subscribe(() => {
      this.resetToModeSelection();
    });
    
    // Check if we're returning to quiz page - reset if no mode selected
    if (!this.selectedMode || this.showModeSelection) {
      this.resetToModeSelection();
    }
  }

  ngOnDestroy() {
    if (this.resetSubscription) {
      this.resetSubscription.unsubscribe();
    }
  }

  resetToModeSelection() {
    this.showModeSelection = true;
    this.selectedMode = null;
    this.currentQuestionIndex = 0;
    this.questions = [];
    this.currentQuestion = null;
    this.leaderboardMode = false;
    this.streak = 0;
    this.maxStreak = 0;
  }

  selectMode(mode: QuizMode) {
    this.selectedMode = mode;
    this.showModeSelection = false;
    this.showLeaderboardToggle = mode.id !== 'missed'; // Don't show leaderboard toggle for missed mode
    this.streak = 0;
    this.maxStreak = 0;
    this.loadQuiz();
  }

  toggleLeaderboardMode() {
    this.leaderboardMode = !this.leaderboardMode;
    this.streak = 0;
    this.maxStreak = 0;
    this.currentQuestionIndex = 0;
    this.questions = [];
    this.loadQuiz();
  }

  trackByIndex(index: number): number {
    return index;
  }

  loadQuiz() {
    this.loading = true;
    this.error = null;

    // Handle missed questions mode
    if (this.selectedMode?.id === 'missed') {
      this.loadMissedQuestions();
      return;
    }

    this.questionService.getAllQuestions(this.selectedMode?.filters).subscribe({
      next: (questions) => {
        // Get active questions
        const activeQuestions = questions.filter(q => q.isActive);
        this.questions = this.shuffleArray(activeQuestions);
        
        if (this.questions.length === 0) {
          this.error = 'No active questions available for this quiz mode.';
          this.loading = false;
          return;
        }

        this.currentQuestionIndex = 0;
        this.loadCurrentQuestion();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load quiz questions.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error loading quiz:', err);
      }
    });
  }

  loadMissedQuestions() {
    // Load all questions and filter to only those the user got wrong
    if (!this.currentUser) {
      this.error = 'You must be logged in to view missed questions.';
      this.loading = false;
      this.showModeSelection = true;
      return;
    }

    this.http.get<any>(`/api/stats/user/${this.currentUser.id}/wrong-questions`).subscribe({
      next: (response) => {
        // Get the wrong question IDs
        const wrongQuestionIds = new Set(response.wrongQuestionIds || []);
        
        if (wrongQuestionIds.size === 0) {
          this.error = 'You haven\'t missed any questions yet! Great job!';
          this.loading = false;
          return;
        }

        // Load all questions and filter to only missed ones
        this.questionService.getAllQuestions({}).subscribe({
          next: (questions) => {
            const missedQuestions = questions.filter(q => wrongQuestionIds.has(q.id) && q.isActive);
            this.questions = this.shuffleArray(missedQuestions);
            
            if (this.questions.length === 0) {
              this.error = 'No missed questions available.';
              this.loading = false;
              return;
            }

            this.currentQuestionIndex = 0;
            this.loadCurrentQuestion();
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.error = 'Failed to load questions.';
            this.loading = false;
            console.error('Error loading questions:', err);
          }
        });
      },
      error: (err) => {
        this.error = 'Failed to load missed questions data.';
        this.loading = false;
        console.error('Error loading stats:', err);
      }
    });
  }

  loadCurrentQuestion() {
    // Replace &nbsp; with regular spaces to allow proper word wrapping
    const question = this.questions[this.currentQuestionIndex];
    this.currentQuestion = {
      ...question,
      question: (question.quiz || question.question).replace(/&nbsp;/g, ' ')
    };
    this.answered = false;
    this.submitting = false;
    this.correct = false;
    this.feedback = '';
    this.longAnswer = '';
    this.textAnswer = '';
    this.displayChoices = [];
    this.skippedCorrectChoices = [];
    
    // Initialize text answers array based on keyword count
    if (this.currentQuestion.questionType === 'text_input' && this.currentQuestion.keywordCount) {
      this.textAnswers = new Array(this.currentQuestion.keywordCount).fill('');
    } else {
      this.textAnswers = [];
    }

    if (this.currentQuestion.questionType === 'single_choice') {
      this.prepareSingleChoiceQuestion();
    } else if (this.currentQuestion.questionType === 'multiple_choice') {
      this.prepareMultipleChoiceQuestion();
    }

    this.cdr.detectChanges();

    // Apply syntax highlighting
    setTimeout(() => {
      document.querySelectorAll('.quiz-question pre').forEach((block) => {
        if (!block.classList.contains('hljs')) {
          block.classList.add('hljs');
          block.classList.add('language-typescript');
          hljs.highlightElement(block as HTMLElement);
        }
      });
    }, 0);
  }

  prepareSingleChoiceQuestion() {
    if (!this.currentQuestion || !this.currentQuestion.choices) return;

    // Backend already filtered to 4 choices, just shuffle them
    this.displayChoices = this.shuffleArray([...this.currentQuestion.choices]).map(c => ({
      ...c,
      selected: false
    }));
  }

  prepareMultipleChoiceQuestion() {
    if (!this.currentQuestion || !this.currentQuestion.choices) return;

    // Backend already filtered to 4 choices, just shuffle them
    this.displayChoices = this.shuffleArray([...this.currentQuestion.choices]).map(c => ({
      ...c,
      selected: false
    }));
  }

  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  selectChoice(index: number) {
    if (this.answered || !this.currentQuestion) return;

    if (this.currentQuestion.questionType === 'single_choice') {
      // Deselect all others for single choice
      this.displayChoices = this.displayChoices.map((c, i) => ({
        ...c,
        selected: i === index
      }));
    } else {
      // Toggle for multiple choice
      this.displayChoices = this.displayChoices.map((c, i) => ({
        ...c,
        selected: i === index ? !c.selected : c.selected
      }));
    }
  }

  submitAnswer() {
    if (this.answered || this.submitting || !this.currentQuestion) return;
    
    this.submitting = true;

    const isTextInput = this.currentQuestion.questionType === 'text_input';

    // Load long answer and correct choices
    this.questionService.getAnswer(this.currentQuestion.id).subscribe({
      next: (result) => {
        const cleanedAnswer = result.answer.replace(/&nbsp;/g, ' ');
        this.longAnswer = cleanedAnswer;
        
        // Update matchKeywords if provided
        if (result.matchKeywords && this.currentQuestion) {
          this.currentQuestion.matchKeywords = result.matchKeywords;
          // Check text answer now that we have the keywords
          if (isTextInput) {
            this.checkTextAnswer();
          }
        }
        
        // Merge correct answer data into display choices
        if (result.choices && this.displayChoices.length > 0) {
          this.displayChoices = this.displayChoices.map(displayChoice => {
            const correctChoice = result.choices!.find((c: any) => c.id === displayChoice.id);
            return {
              ...displayChoice,
              isGood: correctChoice ? correctChoice.isGood : false
            };
          });
          
          // For multiple choice, store skipped correct answers separately
          if (this.currentQuestion?.questionType === 'multiple_choice') {
            const displayedIds = this.displayChoices.map(c => c.id);
            this.skippedCorrectChoices = result.choices!
              .filter((c: any) => c.isGood && !displayedIds.includes(c.id))
              .map((c: any) => ({
                ...c,
                selected: false,
                skipped: true
              }));
          }
          
          // Now check the choice answer after we have the correct data
          if (this.currentQuestion && !isTextInput) {
            this.checkChoiceAnswer();
          }
        }
        
        // Set answered AFTER validation is complete to prevent red blink
        this.answered = true;
        
        // Record answer if user is logged in
        if (this.currentUser && this.currentQuestion) {
          this.http.post<any>('/api/stats/record', {
            userId: this.currentUser.id,
            questionId: this.currentQuestion.id,
            isCorrect: this.correct,
          }).subscribe({
            next: (response) => {
              console.log('Stats record response:', response);
              
              // Display achievement notifications if any were earned
              if (response.awardedAchievements && response.awardedAchievements.length > 0) {
                console.log('Achievements awarded:', response.awardedAchievements);
                this.awardedAchievements = response.awardedAchievements;
                this.currentAchievementIndex = 0;
                this.showAchievementNotification = true;
                this.cdr.detectChanges();
                
                // Show achievements one-by-one with 4 sec delay
                let index = 0;
                const showNextAchievement = () => {
                  // Hide current achievement
                  this.showAchievementNotification = false;
                  this.cdr.detectChanges();
                  
                  setTimeout(() => {
                    index++;
                    if (index < this.awardedAchievements.length) {
                      this.currentAchievementIndex = index;
                      this.showAchievementNotification = true;
                      this.cdr.detectChanges();
                      setTimeout(showNextAchievement, 4000);
                    } else {
                      // All achievements shown, hide
                      this.showAchievementNotification = false;
                      this.cdr.detectChanges();
                    }
                  }, 300);
                };
                
                // Start the sequence after 4 seconds
                setTimeout(showNextAchievement, 4000);
              }
            },
            error: (err) => {
              console.error('Error recording answer:', err);
            }
          });
        }
        
        this.cdr.detectChanges();
        
        // Apply syntax highlighting to answer
        setTimeout(() => {
          document.querySelectorAll('.quiz-answer pre').forEach((block) => {
            if (!block.classList.contains('hljs')) {
              block.classList.add('hljs');
              block.classList.add('language-typescript');
              hljs.highlightElement(block as HTMLElement);
            }
          });
        }, 0);
      },
      error: (err) => {
        console.error('Error loading answer:', err);
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  checkTextAnswer() {
    if (!this.currentQuestion || !this.currentQuestion.matchKeywords) return;

    // Normalize function: trim, lowercase, remove ?, !, ., -, /, '
    const normalize = (text: string) => text.trim().toLowerCase().replace(/[?!.\-\/']/g, '');

    const keywords = this.currentQuestion.matchKeywords.map(normalize);
    const userAnswers = this.textAnswers.map(normalize);
    
    // Track which keywords have been matched to handle duplicates
    const matchedKeywords = new Set<string>();
    
    // Check each field: it's correct if it matches a keyword that hasn't been used yet
    this.textAnswersCorrect = userAnswers.map((answer) => {
      if (answer === '' || !keywords.includes(answer)) {
        return false; // Empty or not a valid keyword
      }
      
      if (matchedKeywords.has(answer)) {
        return false; // Duplicate - this keyword was already used
      }
      
      matchedKeywords.add(answer);
      return true; // Valid and unique
    });
    
    // Overall correctness: all keywords must be present exactly once
    const userSet = new Set(userAnswers.filter(a => a !== ''));
    const keywordSet = new Set(keywords);
    
    this.correct = userAnswers.length === keywords.length &&
                   userSet.size === keywordSet.size &&
                   [...keywordSet].every(keyword => userSet.has(keyword));

    if (this.correct) {
      this.feedback = 'Correct! ✓';
    } else {
      this.feedback = '';
    }
  }

  getMissingKeyword(index: number): string | null {
    if (!this.currentQuestion || !this.currentQuestion.matchKeywords || !this.answered) {
      return null;
    }

    // Normalize function: trim, lowercase, remove ?, !, ., -, /, '
    const normalize = (text: string) => text.trim().toLowerCase().replace(/[?!.\-\/']/g, '');

    const keywords = this.currentQuestion.matchKeywords.map(normalize);
    const userAnswers = this.textAnswers.map(normalize);
    
    // Find which keywords were correctly matched (only count correct answers)
    const correctlyMatchedKeywords = new Set<string>();
    this.textAnswers.forEach((answer, i) => {
      if (this.textAnswersCorrect[i]) {
        correctlyMatchedKeywords.add(normalize(answer));
      }
    });
    
    // Find which keywords are still missing
    const missingKeywords = keywords.filter(keyword => !correctlyMatchedKeywords.has(keyword));
    
    // Track which missing keywords have been shown to previous wrong fields
    const missingKeywordsShownBefore = new Set<string>();
    for (let i = 0; i < index; i++) {
      if (!this.textAnswersCorrect[i]) {
        const missing = this.getMissingKeywordForIndex(i, correctlyMatchedKeywords, keywords, missingKeywordsShownBefore);
        if (missing) {
          missingKeywordsShownBefore.add(normalize(missing));
        }
      }
    }
    
    // Find the first missing keyword that hasn't been shown yet
    const availableMissing = missingKeywords.filter(keyword => !missingKeywordsShownBefore.has(keyword));
    
    // Return the first available missing keyword (in original case from matchKeywords)
    if (availableMissing.length > 0) {
      const missingIndex = keywords.indexOf(availableMissing[0]);
      return this.currentQuestion.matchKeywords[missingIndex];
    }
    
    return null;
  }

  private getMissingKeywordForIndex(index: number, correctlyMatchedKeywords: Set<string>, keywords: string[], alreadyShown: Set<string>): string | null {
    const missingKeywords = keywords.filter(keyword => !correctlyMatchedKeywords.has(keyword) && !alreadyShown.has(keyword));
    
    if (missingKeywords.length > 0 && this.currentQuestion?.matchKeywords) {
      const missingIndex = keywords.indexOf(missingKeywords[0]);
      return this.currentQuestion.matchKeywords[missingIndex];
    }
    
    return null;
  }

  checkChoiceAnswer() {
    if (!this.currentQuestion) return;

    const selectedChoices = this.displayChoices.filter(c => c.selected);
    const correctChoices = this.displayChoices.filter(c => c.isGood);

    if (this.currentQuestion.questionType === 'single_choice') {
      this.correct = selectedChoices.length === 1 && selectedChoices[0].isGood;
      this.feedback = this.correct ? 'Correct! ✓' : '';
    } else {
      // For multiple choice, all selected must be correct and all correct must be selected
      const allCorrectSelected = correctChoices.every(c => c.selected);
      const noWrongSelected = selectedChoices.every(c => c.isGood);
      
      // Special case: if there are no correct answers, user should select nothing
      if (correctChoices.length === 0) {
        this.correct = selectedChoices.length === 0;
      } else {
        this.correct = allCorrectSelected && noWrongSelected;
      }
      
      this.feedback = this.correct ? 'Correct! ✓' : '';
    }

    // Track streak for leaderboard mode
    if (this.leaderboardMode) {
      if (this.correct) {
        this.streak++;
        this.maxStreak = Math.max(this.maxStreak, this.streak);
      } else {
        // Wrong answer in leaderboard mode ends the quiz
        this.maxStreak = Math.max(this.maxStreak, this.streak);
      }
    }
  }

  nextQuestion() {
    this.showAchievementNotification = false;
    
    // In leaderboard mode, end quiz if answer was wrong
    if (this.leaderboardMode && !this.correct) {
      this.currentQuestion = null;
      return;
    }

    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.loadCurrentQuestion();
    } else {
      // Quiz completed
      this.currentQuestion = null;
    }
  }

  restartQuiz() {
    this.showModeSelection = true;
    this.selectedMode = null;
    this.currentQuestionIndex = 0;
    this.questions = [];
    this.currentQuestion = null;
    this.leaderboardMode = false;
    this.streak = 0;
    this.maxStreak = 0;
  }

  get currentQuestionNumber(): number {
    return this.currentQuestionIndex + 1;
  }

  get totalQuestions(): number {
    return this.questions.length;
  }

  get isQuizComplete(): boolean {
    return this.currentQuestion === null && this.questions.length > 0;
  }

  get canSubmit(): boolean {
    if (this.answered || this.submitting || !this.currentQuestion) return false;

    if (this.currentQuestion.questionType === 'text_input') {
      // Check if using multiple inputs or single input
      if (this.textAnswers.length > 0) {
        return this.textAnswers.every(a => a.trim().length > 0);
      } else {
        return this.textAnswer.trim().length > 0;
      }
    } else if (this.currentQuestion.questionType === 'single_choice') {
      // For single choice, check if any choice is selected
      return this.displayChoices.some(choice => choice.selected);
    } else {
      return true; // Always allow submission for multiple choice questions
    }
  }

  get canSkip(): boolean {
    if (this.answered || !this.currentQuestion) return false;
    return this.currentQuestion.questionType === 'text_input' || 
           this.currentQuestion.questionType === 'single_choice';
  }

  skipQuestion() {
    if (!this.currentQuestion) return;
    
    const isTextInput = this.currentQuestion.questionType === 'text_input';
    
    // For text input, mark all answers as incorrect
    if (isTextInput) {
      this.textAnswersCorrect = this.textAnswers.map(() => false);
    }
    
    this.correct = false;
    this.feedback = 'Skipped';

    // Load long answer and correct choices/keywords
    this.questionService.getAnswer(this.currentQuestion.id).subscribe({
      next: (result) => {
        const cleanedAnswer = result.answer.replace(/&nbsp;/g, ' ');
        this.longAnswer = cleanedAnswer;
        
        // Update matchKeywords if provided
        if (result.matchKeywords && this.currentQuestion) {
          this.currentQuestion.matchKeywords = result.matchKeywords;
        }
        
        // Merge correct answer data into display choices
        if (result.choices && this.displayChoices.length > 0) {
          this.displayChoices = this.displayChoices.map(displayChoice => {
            const correctChoice = result.choices!.find((c: any) => c.id === displayChoice.id);
            return {
              ...displayChoice,
              isGood: correctChoice ? correctChoice.isGood : false
            };
          });
        }
        
        // Set answered AFTER validation is complete
        this.answered = true;
        
        this.cdr.detectChanges();
        
        // Apply syntax highlighting to answer
        setTimeout(() => {
          document.querySelectorAll('.quiz-answer pre').forEach((block) => {
            if (!block.classList.contains('hljs')) {
              block.classList.add('hljs');
              block.classList.add('language-typescript');
              hljs.highlightElement(block as HTMLElement);
            }
          });
          this.answerHighlightApplied = true;
        }, 0);
      },
      error: (err) => {
        console.error('Error loading answer:', err);
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
