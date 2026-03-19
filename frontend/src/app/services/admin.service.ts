import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API = 'http://localhost:3000/api/admin';

  constructor(private http: HttpClient) {}

  getAllRequests(filters?: { status?: string; search?: string; page?: number; limit?: number }): Observable<any> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.page)   params = params.set('page',   filters.page.toString());
    if (filters?.limit)  params = params.set('limit',  filters.limit.toString());
    return this.http.get<any>(`${this.API}/requests`, { params });
  }

  approveRequest(id: string): Observable<any> {
    return this.http.put<any>(`${this.API}/approve/${id}`, {});
  }

  rejectRequest(id: string, reason: string): Observable<any> {
    return this.http.put<any>(`${this.API}/reject/${id}`, { reason });
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.API}/stats`);
  }

  getAllUsers(): Observable<any> {
    return this.http.get<any>(`${this.API}/users`);
  }

  toggleUserStatus(id: string): Observable<any> {
    return this.http.put<any>(`${this.API}/users/${id}/toggle`, {});
  }
}
