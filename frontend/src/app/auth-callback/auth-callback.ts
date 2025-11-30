import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
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
        this.authService.handleCallback(token);
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1000);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
