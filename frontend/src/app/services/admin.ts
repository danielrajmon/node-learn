import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question, CreateQuestion } from '../models/question.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  createQuestion(question: CreateQuestion): Observable<Question> {
    return this.http.post<Question>(`${this.apiUrl}/questions`, question);
  }
}
