import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, AuthUser } from '../../../../core/services/auth';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  user: AuthUser | null = null;
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.auth.getCurrentUserFromApi().subscribe({
      next: user => {
        this.user = user;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger votre profil.';
        this.changeDetector.markForCheck();
      },
    });
  }

  logout() {

    this.auth.logout();

    this.router.navigate([
      '/'
    ]);
  }
}