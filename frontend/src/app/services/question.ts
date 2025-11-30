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

  getAnswer(questionId: number): Observable<{ questionId: number; answer: string }> {
    return this.http.get<{ questionId: number; answer: string }>(`/api/answers/${questionId}`);
  }
}
