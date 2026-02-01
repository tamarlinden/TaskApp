import { Component, ElementRef, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommentService } from '../../services/comment';
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
  private authService = inject(Auth);
  private fb = inject(FormBuilder);

  comments = signal<Comment[]>([]);
  showAddForm = signal(false);
  isVisible = signal(false);
  isLoading = signal(false);

  commentForm = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(2)]]
  });

  ngOnInit() {
    // Comments are now lazy loaded
    console.log('Comments component initialized with WhatsApp style');
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
      const commentData = {
        body: this.commentForm.value.content,
        taskId: this.taskId
      };

      this.commentService.createComment(commentData).subscribe({
        next: (newComment) => {
          this.comments.set([...this.comments(), newComment]);
          this.showAddForm.set(false);
          this.commentForm.reset();
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

  private scrollCommentsToBottom() {
    const el = this.commentsList?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'numeric'
    });
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
