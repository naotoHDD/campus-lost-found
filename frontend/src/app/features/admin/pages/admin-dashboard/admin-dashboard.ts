import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService, AdminStats } from '../../../../core/services/admin';
@Component({ selector:'app-admin-dashboard', imports:[RouterLink], templateUrl:'./admin-dashboard.html', styleUrl:'./admin-dashboard.scss' })
export class AdminDashboard {
  stats: { label: string; value: number; route: string }[] = [];
  governorateCount = 0;
  errorMessage = '';

  constructor(private readonly admin: AdminService, private readonly changeDetector: ChangeDetectorRef) {
    this.admin.getStats().subscribe({
      next: stats => {
        this.setStats(stats);
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les statistiques.';
        this.changeDetector.markForCheck();
      },
    });
  }

  private setStats(stats: AdminStats): void {
    this.stats = [
      { label: 'Utilisateurs', value: stats.totalUsers, route: '/admin/users' },
      { label: 'Annonces actives', value: stats.activeItems, route: '/admin/items' },
      { label: 'Réclamations en attente', value: stats.pendingClaims, route: '/admin/claims' },
      { label: 'Objets rendus', value: stats.returnedItems, route: '/admin/items' },
    ];
  }
}
