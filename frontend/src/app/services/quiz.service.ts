import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface QuizMode {
  id: string;
  name: string;
  description: string;
  filters: any;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private quizModesSubject = new BehaviorSubject<QuizMode[]>([]);
  public quizModes$ = this.quizModesSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadQuizModes(): Observable<QuizMode[]> {
    return this.http.get<QuizMode[]>('/api/quiz/modes').pipe(
      tap(modes => this.quizModesSubject.next(modes))
    );
  }

  getQuizModes(): QuizMode[] {
    return this.quizModesSubject.value;
  }
}
