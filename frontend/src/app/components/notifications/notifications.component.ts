import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CreditService } from '../../services/credit.service';
import { Notification } from '../../models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  loading = true;

  constructor(private creditSvc: CreditService) {}

  ngOnInit(): void {
    this.creditSvc.getNotifications().subscribe({
      next: (res) => { this.notifications = res.notifications; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  markAllRead(): void {
    this.creditSvc.markAllRead().subscribe(() => {
      this.notifications.forEach(n => n.is_read = true);
    });
  }
}
