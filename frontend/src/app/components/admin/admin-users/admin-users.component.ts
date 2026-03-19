import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  filtered: any[] = [];
  loading = true;
  search = '';

  constructor(private adminSvc: AdminService) {}

  ngOnInit(): void {
    this.adminSvc.getAllUsers().subscribe({
      next: (res) => { this.users = res.users; this.filtered = res.users; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }

  toggle(id: string): void {
    this.adminSvc.toggleUserStatus(id).subscribe(res => {
      const u = this.users.find(x => x.id === id);
      if (u) u.is_active = res.user.is_active;
    });
  }
}
