import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimulationParams, SimulationResult, Credit, CreditRequest, Notification } from '../models';

@Injectable({ providedIn: 'root' })
export class CreditService {
  private readonly API = 'http://localhost:3000/api/credits';

  constructor(private http: HttpClient) {}

  simulate(params: SimulationParams): Observable<{ success: boolean; simulation: SimulationResult }> {
    return this.http.post<any>(`${this.API}/simulate`, params);
  }

  getUserCredits(): Observable<{ success: boolean; credits: Credit[] }> {
    return this.http.get<any>(this.API);
  }

  getUserRequests(page = 1, limit = 10): Observable<any> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<any>(`${this.API}/requests`, { params });
  }

  createRequest(data: FormData): Observable<any> {
    return this.http.post<any>(`${this.API}/request`, data);
  }

  getNotifications(): Observable<{ success: boolean; notifications: Notification[]; unread: number }> {
    return this.http.get<any>(`${this.API}/notifications`);
  }

  markAllRead(): Observable<any> {
    return this.http.put<any>(`${this.API}/notifications/read`, {});
  }
}
