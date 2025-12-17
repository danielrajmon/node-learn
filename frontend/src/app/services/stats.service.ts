import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QuestionStat {
  id: number;
  user_id: number;
  question_id: number;
  correct_count: number;
  incorrect_count: number;
  question: string;
  topic: string;
  difficulty: string;
  total_attempts: number;
  accuracy_percentage: string;
}

export interface UserStatsResponse {
  overall: {
    totalCorrect: number;
    totalIncorrect: number;
    totalAttempts: number;
    overallAccuracy: string | number;
  };
  questions: QuestionStat[];
}

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  constructor(private http: HttpClient) {}

  getUserStats(userId: number): Observable<UserStatsResponse> {
    return this.http.get<UserStatsResponse>(`/api/stats/user/${userId}`);
  }
}
