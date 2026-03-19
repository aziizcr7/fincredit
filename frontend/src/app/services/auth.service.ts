import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API       = 'http://localhost:3000/api/auth';
  private readonly TOKEN_KEY = 'fc_token';
  private readonly USER_KEY  = 'fc_user';

  private _user   = signal<User | null>(this.loadUser());
  currentUser     = this._user.asReadonly();
  isLoggedIn      = computed(() => !!this._user());
  isAdmin         = computed(() => this._user()?.role === 'admin');

  constructor(private http: HttpClient, private router: Router) {}

  register(data: { name: string; email: string; password: string; phone?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register`, data)
      .pipe(tap(res => this.saveSession(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, { email, password })
      .pipe(tap(res => this.saveSession(res)));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.API}/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.API}/profile`, data)
      .pipe(tap(res => {
        if (res.success) {
          const updated = { ...this._user()!, ...res.user };
          localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
          this._user.set(updated);
        }
      }));
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY,  JSON.stringify(res.user));
    this._user.set(res.user);
  }

  private loadUser(): User | null {
    try {
      const s = localStorage.getItem(this.USER_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  }
}
