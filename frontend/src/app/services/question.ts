import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question, AnswerResult } from '../models/question.model';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  constructor(private http: HttpClient) {}

  getAllQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>('/api/questions');
  }

  getRandomQuestion(): Observable<Question> {
    return this.http.get<Question>('/api/questions/random');
  }

  submitAnswer(questionId: number, answer: string): Observable<AnswerResult> {
    return this.http.post<AnswerResult>(`/api/answers/${questionId}`, { answer });
  }
}
