import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question, AnswerResult } from '../models/question.model';

export interface QuestionFilters {
  difficulty?: 'easy' | 'medium' | 'hard';
  questionType?: 'single_choice' | 'multiple_choice' | 'text_input';
  practical?: boolean;
  search?: string;
  topic?: string;
}

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  constructor(private http: HttpClient) {}

  getAllQuestions(filters?: QuestionFilters): Observable<Question[]> {
    // Add timestamp to prevent caching
    let url = `/api/questions?_t=${Date.now()}`;
    
    if (filters) {
      if (filters.difficulty) {
        url += `&difficulty=${encodeURIComponent(filters.difficulty)}`;
      }
      if (filters.questionType) {
        url += `&questionType=${encodeURIComponent(filters.questionType)}`;
      }
      if (filters.practical !== undefined) {
        url += `&practical=${filters.practical}`;
      }
      if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
      }
      if (filters.topic) {
        url += `&topic=${encodeURIComponent(filters.topic)}`;
      }
    }
    
    return this.http.get<Question[]>(url);
  }

  getRandomQuestion(): Observable<Question> {
    return this.http.get<Question>('/api/questions/random');
  }

  getQuestionById(id: number): Observable<Question> {
    return this.http.get<Question>(`/api/questions/${id}`);
  }

  getAnswer(questionId: number): Observable<{ questionId: number; answer: string; choices?: any[]; matchKeywords?: string[] }> {
    return this.http.get<{ questionId: number; answer: string; choices?: any[] }>(`/api/answers/${questionId}`);
  }
}
