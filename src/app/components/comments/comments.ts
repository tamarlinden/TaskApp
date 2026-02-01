import { Component, ElementRef, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommentService } from '../../services/comment';
import { NotificationService } from '../../services/notification';
import { Comment } from '../../models/task.model';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './comments.html',
  styleUrls: ['./comments.css'],
})

export class Comments implements OnInit {
  @Input() taskId!: string;

  @ViewChild('commentsList') private commentsList?: ElementRef<HTMLDivElement>;
  @ViewChild('commentInput') private commentInput?: ElementRef<HTMLInputElement>;
  
  private commentService = inject(CommentService);
  private notificationService = inject(NotificationService);
  private authService = inject(Auth);
  private fb = inject(FormBuilder);

  comments = signal<Comment[]>([]);
  showAddForm = signal(false);
  isVisible = signal(false);
  isLoading = signal(false);
  isMentioning = signal(false);
  mentionSuggestions = signal<any[]>([]);
  teamMembers = signal<any[]>([]);

  commentForm = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(2)]]
  });

  ngOnInit() {
    // Comments are now lazy loaded
    console.log('Comments component initialized with mention & notification support');
    this.loadTeamMembers();
  }

  private loadTeamMembers() {
    // Mock team members - in real app, fetch from API
    this.teamMembers.set([
      { id: '1', name: 'ישראל כהן', email: 'israel@example.com' },
      { id: '2', name: 'דפנה לוי', email: 'daphna@example.com' },
      { id: '3', name: 'אהרון זוסמן', email: 'aharon@example.com' }
    ]);
  }

  toggleVisibility() {
    this.isVisible.set(!this.isVisible());
    if (this.isVisible() && this.comments().length === 0) {
      this.loadComments();
    }
  }

  loadComments() {
    this.isLoading.set(true);
    this.commentService.getCommentsByTask(this.taskId).subscribe({
      next: (data) => {
        this.comments.set(data);
        this.isLoading.set(false);
        requestAnimationFrame(() => this.scrollCommentsToBottom());
      },
      error: (err) => {
        console.error('שגיאה בטעינת תגובות', err);
        this.isLoading.set(false);
      }
    });
  }

  toggleAddForm() {
    this.showAddForm.set(!this.showAddForm());
    this.commentForm.reset();
  }

  addComment() {
    if (this.commentForm.valid && this.commentForm.value.content) {
      const commentText = this.commentForm.value.content;
      const commentData = {
        body: commentText,
        taskId: this.taskId
      };

      this.commentService.createComment(commentData).subscribe({
        next: (newComment) => {
          this.comments.set([...this.comments(), newComment]);
          this.showAddForm.set(false);
          this.commentForm.reset();
          
          // Extract mentions and create notifications
          this.processMentions(commentText);
          
          requestAnimationFrame(() => {
            this.scrollCommentsToBottom();
            this.commentInput?.nativeElement.focus();
          });
        },
        error: (err) => {
          console.error('שגיאה בהוספת תגובה:', err);
          if (err.status === 0) {
            alert('לא ניתן להתחבר לשרת. ודא שהשרת רץ על http://localhost:3000');
          } else {
            alert('שגיאה בהוספת תגובה: ' + (err.error?.message || err.message));
          }
        }
      });
    } else {
      alert('נא למלא את שדה התגובה');
    }
  }

  private processMentions(text: string) {
    const mentions = this.extractMentions(text);
    const currentUser = this.authService.currentUser();
    
    mentions.forEach(mention => {
      this.notificationService.createNotification({
        user_id: mention.id,
        type: 'mention',
        title: `${currentUser?.name} mentioned you`,
        message: `You were mentioned in a comment: "${text.substring(0, 50)}..."`,
        task_id: this.taskId,
        from_user_id: currentUser?.id.toString(),
        from_user_name: currentUser?.name,
        is_read: false
      }).subscribe({
        next: () => console.log(`Notification sent to ${mention.name}`),
        error: (err) => console.error('Error creating notification:', err)
      });
    });
  }

  private extractMentions(text: string): any[] {
    const mentionRegex = /@(\S+)/g;
    const matches = [...text.matchAll(mentionRegex)];
    const results: any[] = [];
    
    matches.forEach(match => {
      const mentionedName = match[1];
      const found = this.teamMembers().find(m => 
        m.name.includes(mentionedName) || m.email.includes(mentionedName)
      );
      if (found && !results.find(r => r.id === found.id)) {
        results.push(found);
      }
    });
    
    return results;
  }

  onCommentInputChange(event: any) {
    const value = event.target.value;
    
    // Check for @ mention
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const searchText = value.substring(lastAtIndex + 1);
      if (searchText.length > 0 && searchText.length < 20 && !searchText.includes(' ')) {
        this.showMentionSuggestions(searchText);
      }
    } else {
      this.isMentioning.set(false);
    }
  }

  private showMentionSuggestions(searchText: string) {
    const filtered = this.teamMembers().filter(m =>
      m.name.includes(searchText) || m.email.includes(searchText)
    );

    this.mentionSuggestions.set(filtered);
    this.isMentioning.set(filtered.length > 0);
  }

  selectMention(member: any) {
    const form = this.commentForm;
    const text = form.get('content')?.value || '';
    const lastAtIndex = text.lastIndexOf('@');
    const beforeMention = text.substring(0, lastAtIndex);
    form.get('content')?.setValue(`${beforeMention}@${member.name} `);
    this.isMentioning.set(false);
  }

  private scrollCommentsToBottom() {
    const el = this.commentsList?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    
    // הגדר את זמן התחלת היום
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    // הגדר את זמן התחלת אתמול
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    // הגדר את זמן סוף אתמול
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const time = date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // אם הודעה מהיום - הצג רק שעה
    if (date >= todayStart) {
      return time;
    }

    // אם הודעה מאתמול - הצג "אתמול, HH:MM"
    if (date >= yesterdayStart && date <= yesterdayEnd) {
      return `אתמול, ${time}`;
    }

    // לפני יותר מ-2 ימים - הצג תאריך מלא עם שעה
    const dateStr = date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'numeric',
      year: '2-digit'
    });
    
    return `${dateStr}, ${time}`;
  }

  isMyComment(comment: Comment): boolean {
    const user = this.authService.currentUser();
    // Convert both to strings to ensure correct comparison (backend might return number, frontend uses string or vice versa)
    return user ? String(comment.user_id) === String(user.id) : false;
  }
  
  getCurrentUsername(): string {
    const user = this.authService.currentUser();
    return user?.name || 'משתמש';
  }
}
