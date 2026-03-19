import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { CreditService } from '../../../services/credit.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  user       = this.auth.currentUser;
  isAdmin    = this.auth.isAdmin;
  unreadCount = 0;
  sidebarOpen = true;

  constructor(private auth: AuthService, private credit: CreditService, private router: Router) {
    this.loadUnread();
  }

  loadUnread(): void {
    this.credit.getNotifications().subscribe({
      next: (res) => this.unreadCount = res.unread,
      error: () => {}
    });
  }

  logout(): void { this.auth.logout(); }

  get initials(): string {
    const name = this.user()?.name || '';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }
}
