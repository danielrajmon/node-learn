import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question, AnswerResult } from '../models/question.model';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private apiUrl = this.getApiUrl();

  constructor(private http: HttpClient) {}

  private getApiUrl(): string {
    // In production (Docker), use the same host on port 3000
    // In development, use localhost:3000
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3000';
    }
    return `http://${window.location.hostname}:3000`;
  }

  getAllQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/questions`);
  }

  getRandomQuestion(): Observable<Question> {
    return this.http.get<Question>(`${this.apiUrl}/questions/random`);
  }

  submitAnswer(questionId: number, answer: string): Observable<AnswerResult> {
    return this.http.post<AnswerResult>(`${this.apiUrl}/answers/${questionId}`, { answer });
  }
}
