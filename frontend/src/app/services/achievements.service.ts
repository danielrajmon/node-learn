import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Achievement {
  id: number;
  title: string;
  description: string;
  sprite_col: number;
  sprite_row: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AchievementsService {
  private apiUrl = '/api/achievements';

  constructor(private http: HttpClient) {}

  getAllAchievements(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(this.apiUrl);
  }
}
