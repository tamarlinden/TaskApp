import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification';
import { Notification } from '../../models/task.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class Notifications implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  isLoading = signal(false);
  showPanel = signal(false);

  ngOnInit() {
    this.loadNotifications();
    // התחל polling כל 10 שניות לעדכון notifications
    this.notificationService.startPolling();
  }

  ngOnDestroy() {
    // עצור polling כשה-component מותבקע
    this.notificationService.stopPolling();
  }

  private loadNotifications() {
    this.isLoading.set(true);
    // הוסף 500ms delay כדי שנראה ה-loading, אחר כך טען mock data
    setTimeout(() => {
      this.notificationService.getNotifications().subscribe({
        next: (notifications) => {
          if (notifications.length === 0) {
            // אם אין notifications מה-API, השתמש במוק דטה
            this.notifications.set(this.getMockNotifications());
          } else {
            this.notifications.set(notifications);
          }
          this.updateUnreadCount();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading notifications:', err);
          // אם יש שגיאה, השתמש במוק דטה
          this.notifications.set(this.getMockNotifications());
          this.updateUnreadCount();
          this.isLoading.set(false);
        }
      });
    }, 500);
  }

  private getMockNotifications(): Notification[] {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    return [
      {
        id: '1',
        user_id: 'user1',
        type: 'mention',
        title: 'דפנה לוי mentioned you',
        message: 'You were mentioned in a comment: "דפנה צודקת לגמרי!"',
        task_id: 'task1',
        from_user_id: 'user2',
        from_user_name: 'דפנה לוי',
        is_read: false,
        created_at: now.toISOString(),
        action_url: '/tasks/task1'
      },
      {
        id: '2',
        user_id: 'user1',
        type: 'comment',
        title: 'ישראל כהן commented',
        message: 'New comment on your task: "זה נראה טוב!"',
        task_id: 'task2',
        from_user_id: 'user3',
        from_user_name: 'ישראל כהן',
        is_read: false,
        created_at: oneHourAgo.toISOString(),
        action_url: '/tasks/task2'
      },
      {
        id: '3',
        user_id: 'user1',
        type: 'assignment',
        title: 'You were assigned a task',
        message: 'New task assigned: "עדכן את ה-dashboard"',
        task_id: 'task3',
        from_user_id: 'user2',
        from_user_name: 'דפנה לוי',
        is_read: true,
        created_at: oneDayAgo.toISOString(),
        action_url: '/tasks/task3'
      }
    ];
  }

  togglePanel() {
    this.showPanel.update(v => !v);
  }

  markAsRead(notification: Notification) {
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          // Update notification in list
          this.notifications.update(notifs =>
            notifs.map(n =>
              n.id === notification.id ? { ...n, is_read: true } : n
            )
          );
          this.updateUnreadCount();
        },
        error: (err) => console.error('Error marking notification as read:', err)
      });
    }
  }

  markAllAsRead(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(notifs =>
          notifs.map(n => ({ ...n, is_read: true }))
        );
        this.updateUnreadCount();
      },
      error: (err) => console.error('Error marking all as read:', err)
    });
  }

  deleteNotification(notificationId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        this.notifications.update(notifs =>
          notifs.filter(n => n.id !== notificationId)
        );
        this.updateUnreadCount();
      },
      error: (err) => console.error('Error deleting notification:', err)
    });
  }

  goToTask(notification: Notification) {
    this.markAsRead(notification);
    if (notification.task_id) {
      // Navigate to task - adjust based on your routing
      this.router.navigate(['/tasks', notification.task_id]);
      this.showPanel.set(false);
    }
  }

  private updateUnreadCount() {
    this.unreadCount.set(
      this.notifications().filter(n => !n.is_read).length
    );
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'mention':
        return '💬';
      case 'comment':
        return '💭';
      case 'assignment':
        return '📋';
      case 'task_update':
        return '✏️';
      default:
        return '🔔';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('he-IL');
  }
}
