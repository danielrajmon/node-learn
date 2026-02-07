import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, of, timeout } from 'rxjs';

interface ServiceHealth {
  name: string;
  url: string;
  status?: number;
  ok?: boolean;
  latencyMs?: number;
  lastChecked?: string;
  checking?: boolean;
}

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-services.html',
  styleUrl: './admin-services.css'
})
export class AdminServicesComponent implements OnInit {
  services: ServiceHealth[] = [
    { name: 'API Gateway', url: '/health' },
    { name: 'Auth', url: '/api/auth/health' },
    { name: 'Questions', url: '/api/questions/health' },
    { name: 'Quiz', url: '/api/quiz/health' },
    { name: 'Achievements', url: '/api/achievements/health' },
    { name: 'Leaderboard', url: '/api/leaderboard/health' },
    { name: 'Admin', url: '/api/admin/health' }
  ];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkAll();
  }

  checkAll(): void {
    this.services.forEach((service) => this.checkService(service));
  }

  trackByName(_index: number, item: ServiceHealth): string {
    return item.name;
  }

  private checkService(service: ServiceHealth): void {
    const started = performance.now();
    service.checking = true;
    service.lastChecked = new Date().toISOString();

    this.http.get(service.url, { observe: 'response' })
      .pipe(
        timeout(5000),
        map((response) => ({ ok: response.status >= 200 && response.status < 300, status: response.status })),
        catchError((error) => of({ ok: false, status: error?.status ?? 0 })),
        finalize(() => {
          service.checking = false;
          service.latencyMs = Math.round(performance.now() - started);
          this.cdr.markForCheck();
        })
      )
      .subscribe((result) => {
        service.ok = result.ok;
        service.status = result.status;
      });
  }
}
