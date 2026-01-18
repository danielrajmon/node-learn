import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: '<div style="text-align: center; padding: 50px;">Logging you in...</div>'
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.handleCallbackAsync(token).then(() => {
          this.router.navigate(['/']);
        }).catch(() => {
          this.router.navigate(['/login']);
        });
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
