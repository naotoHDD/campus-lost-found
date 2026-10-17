import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({ selector: 'app-admin-layout', imports: [RouterOutlet, RouterLink, RouterLinkActive], templateUrl: './admin-layout.html', styleUrl: './admin-layout.scss' })
export class AdminLayout {
  constructor(private auth: AuthService, private router: Router) {}
  logout(): void { this.auth.logout(); this.router.navigate(['/login']); }
}
