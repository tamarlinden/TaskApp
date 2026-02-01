import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, interval, Subscription } from 'rxjs';
import { Notification } from '../models/task.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;
  private pollingSubscription: Subscription | null = null;
  
  // Signal for real-time notification count
  unreadCount = signal(0);

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl);
  }

  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}?is_read=false`);
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${id}`, { is_read: true });
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/mark-all-read`, {});
  }

  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Observable<Notification> {
    return this.http.post<Notification>(this.apiUrl, notification);
  }

  loadUnreadCount(): void {
    this.getUnreadNotifications().subscribe({
      next: (notifications) => {
        this.unreadCount.set(notifications.length);
      },
      error: (err) => console.error('Error loading notifications:', err)
    });
  }

  // Start polling for new notifications every 10 seconds
  startPolling(): void {
    if (this.pollingSubscription) {
      return; // Already polling
    }

    this.pollingSubscription = interval(10000).subscribe(() => {
      this.loadUnreadCount();
    });
  }

  // Stop polling
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }
}
