import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question, AnswerResult } from '../models/question.model';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getRandomQuestion(): Observable<Question> {
    return this.http.get<Question>(`${this.apiUrl}/questions/random`);
  }

  submitAnswer(questionId: number, answer: string): Observable<AnswerResult> {
    return this.http.post<AnswerResult>(`${this.apiUrl}/answers/${questionId}`, { answer });
  }
}
