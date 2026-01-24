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

  getAllQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/questions?_t=${Date.now()}`);
  }

  createQuestion(question: CreateQuestion): Observable<Question> {
    return this.http.post<Question>(`${this.apiUrl}/questions`, question);
  }

  updateQuestion(id: number, question: Partial<CreateQuestion>): Observable<Question> {
    return this.http.put<Question>(`${this.apiUrl}/questions/${id}`, question);
  }

  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/questions/${id}`);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  updateUserRole(id: number, isAdmin: boolean): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${id}/role`, { isAdmin });
  }

  initializeTable(tableName: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/migrations/init-table/${tableName}`, {});
  }

  getTableStatus(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/migrations/table-status`);
  }

  exportQuestions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/questions/export`);
  }

  importQuestions(questions: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/questions/import`, { questions });
  }
}
