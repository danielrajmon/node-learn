import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuizStateService {
  private resetToModeSelectionSubject = new Subject<void>();
  public resetToModeSelection$ = this.resetToModeSelectionSubject.asObservable();

  resetToModeSelection(): void {
    this.resetToModeSelectionSubject.next();
  }
}
