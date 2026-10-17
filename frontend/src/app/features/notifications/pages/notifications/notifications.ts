import { ChangeDetectorRef, Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationsService, UserNotification } from '../../../../core/services/notifications';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss'
})
export class Notifications {

  notifications: UserNotification[] = [];
  loading = true;
  errorMessage = '';

  constructor(notificationsService: NotificationsService, private readonly changeDetector: ChangeDetectorRef) {
    notificationsService.getMyNotifications().subscribe({
      next: notifications => {
        this.notifications = notifications;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les notifications.';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

}