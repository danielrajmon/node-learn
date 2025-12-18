import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuizStateService {
  private resetToModeSelectionSubject = new Subject<void>();
  public resetToModeSelection$ = this.resetToModeSelectionSubject.asObservable();
  
  private confirmResetSubject = new Subject<(confirm: boolean) => void>();
  public confirmReset$ = this.confirmResetSubject.asObservable();

  resetToModeSelection(): void {
    this.resetToModeSelectionSubject.next();
  }

  requestConfirmReset(callback: (confirmed: boolean) => void): void {
    this.confirmResetSubject.next(callback);
  }
}
