import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '../../../../core/services/admin';
@Component({selector:'app-admin-users',imports:[FormsModule],templateUrl:'./admin-users.html',styleUrl:'./admin-users.scss'})
export class AdminUsers {
  users: AdminUser[] = [];
  errorMessage = '';

  constructor(private readonly admin: AdminService, private readonly changeDetector: ChangeDetectorRef) {
    this.loadUsers();
  }

  loadUsers(): void {
    this.admin.getUsers().subscribe({
      next: users => {
        this.users = users;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les utilisateurs.';
        this.changeDetector.markForCheck();
      },
    });
  }

  changeRole(user: AdminUser, role: AdminUser['role']): void {
    const previousRole = user.role;
    user.role = role;
    this.admin.updateUserRole(user.id, role).subscribe({
      error: () => {
        user.role = previousRole;
        this.errorMessage = 'Impossible de modifier le rôle.';
        this.changeDetector.markForCheck();
      },
    });
  }
}
