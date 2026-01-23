import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LeaderboardEntry {
  quiz_mode_id: string;
  position: number;
  user_id: number;
  correct_answers: number;
  total_questions: number;
  streak: number;
  achieved_at: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  constructor(private http: HttpClient) {}

  updateLeaderboard(
    modeId: string,
    userId: number,
    correctAnswers: number,
    totalQuestions: number,
    correctAnswersCount: number,
    username: string
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>('/api/leaderboard/update', {
      modeId,
      userId,
      correctAnswers,
      totalQuestions,
      correctAnswersCount,
      username
    });
  }

  getLeaderboard(modeId: string): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`/api/leaderboard/mode/${modeId}`);
  }
}
