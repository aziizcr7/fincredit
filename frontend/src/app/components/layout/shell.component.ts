// src/app/components/layout/shell.component.ts
import { Component, computed } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService }         from '../../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
<div class="app-layout">

  <!-- ── Sidebar ── -->
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-mark">FC</div>
      <div class="logo-text">Fin<span>Credit</span> Pro</div>
    </div>

    <!-- Nav Client -->
    <nav *ngIf="!isAdmin()">
      <div class="nav-section">Menu principal</div>
      <a class="nav-item" routerLink="/dashboard"   routerLinkActive="active">
        <span class="nav-icon">📊</span> Dashboard
      </a>
      <a class="nav-item" routerLink="/simulator"   routerLinkActive="active">
        <span class="nav-icon">🔢</span> Simulateur
      </a>
      <a class="nav-item" routerLink="/request"     routerLinkActive="active">
        <span class="nav-icon">📄</span> Demande de crédit
      </a>
      <a class="nav-item" routerLink="/my-credits"  routerLinkActive="active">
        <span class="nav-icon">💳</span> Mes crédits
      </a>

      <div class="nav-section" style="margin-top:16px;">Mon compte</div>
      <a class="nav-item" routerLink="/notifications" routerLinkActive="active">
        <span class="nav-icon">🔔</span> Notifications
      </a>
      <a class="nav-item" routerLink="/profile"     routerLinkActive="active">
        <span class="nav-icon">👤</span> Mon profil
      </a>
    </nav>

    <!-- Nav Admin -->
    <nav *ngIf="isAdmin()">
      <div class="nav-section">Administration</div>
      <a class="nav-item" routerLink="/admin/dashboard" routerLinkActive="active">
        <span class="nav-icon">📊</span> Tableau de bord
      </a>
      <a class="nav-item" routerLink="/admin/requests"  routerLinkActive="active">
        <span class="nav-icon">📋</span> Demandes
      </a>
      <a class="nav-item" routerLink="/admin/users"     routerLinkActive="active">
        <span class="nav-icon">👥</span> Utilisateurs
      </a>
    </nav>

    <div class="sidebar-footer">
      <div class="user-chip" (click)="logout()">
        <div class="user-avatar">{{ userInitial() }}</div>
        <div>
          <div class="user-name">{{ userName() }}</div>
          <div class="user-role">{{ isAdmin() ? 'Administrateur' : 'Client' }}</div>
        </div>
        <span class="logout-icon">⏏</span>
      </div>
    </div>
  </aside>

  <!-- ── Main Content ── -->
  <main class="main-content">
    <router-outlet></router-outlet>
  </main>

</div>
  `,
  styles: [`
    .sidebar {
      width: 256px; flex-shrink: 0;
      background: rgba(10,22,40,0.94);
      border-right: 1px solid rgba(43,107,255,0.18);
      display: flex; flex-direction: column;
      padding: 28px 0;
      position: fixed; top: 0; left: 0; bottom: 0;
      z-index: 100; backdrop-filter: blur(20px);
    }
    .sidebar-logo {
      display: flex; align-items: center; gap: 12px;
      padding: 0 22px 28px;
      border-bottom: 1px solid rgba(43,107,255,0.18);
      margin-bottom: 16px;
    }
    .logo-mark {
      width: 38px; height: 38px; border-radius: 9px;
      background: linear-gradient(135deg, #1B4FD8, #00C8FF);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Syne', sans-serif; font-weight: 800; font-size: 16px;
      box-shadow: 0 4px 16px rgba(27,79,216,0.45);
    }
    .logo-text { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; }
    .logo-text span { color: #00C8FF; }
    .nav-section { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #8B9BB4; padding: 8px 22px 6px; }
    .nav-item {
      display: flex; align-items: center; gap: 11px;
      padding: 11px 22px; text-decoration: none;
      color: #C5CFE0; font-size: 14px;
      border-left: 3px solid transparent;
      transition: all 0.2s;
      &:hover { background: rgba(27,79,216,0.1); color: #F4F7FC; }
      &.active { background: rgba(27,79,216,0.18); color: #F4F7FC; border-left-color: #2D6AFF; font-weight: 500; }
    }
    .nav-icon { font-size: 17px; width: 20px; text-align: center; }
    .sidebar-footer { margin-top: auto; padding: 18px 22px; border-top: 1px solid rgba(43,107,255,0.18); }
    .user-chip {
      display: flex; align-items: center; gap: 10px;
      background: rgba(27,79,216,0.12); border: 1px solid rgba(43,107,255,0.18);
      border-radius: 12px; padding: 10px 13px;
      cursor: pointer; transition: all 0.2s;
      &:hover { background: rgba(27,79,216,0.22); }
    }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #1B4FD8, #00C8FF);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px;
      flex-shrink: 0;
    }
    .user-name { font-size: 13px; font-weight: 500; color: #F4F7FC; }
    .user-role { font-size: 11px; color: #8B9BB4; }
    .logout-icon { margin-left: auto; color: #8B9BB4; font-size: 15px; }
    .main-content { margin-left: 256px; flex: 1; padding: 32px 36px; min-height: 100vh; }

    @media (max-width: 900px) {
      .sidebar { transform: translateX(-100%); }
      .main-content { margin-left: 0; padding: 20px; }
    }
  `]
})
export class ShellComponent {
  constructor(private auth: AuthService, private router: Router) {}

  isAdmin   = this.auth.isAdmin;
  userName  = computed(() => this.auth.currentUser()?.name || 'Utilisateur');
  userInitial = computed(() => this.auth.currentUser()?.name?.[0]?.toUpperCase() || '?');

  logout(): void { this.auth.logout(); }
}
