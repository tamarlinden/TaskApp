import { Component, inject, signal, Input, OnInit, ViewEncapsulation } from '@angular/core';
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
  styles: [`
    /* Base styles */
    .comments-section {
      margin-top: 16px;
      border-top: 1px solid var(--border-light);
      padding: 12px 0 0;
      font-family: var(--font-family);
    }

    .comments-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .comments-header h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .toggle-comments-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 5px 8px;
      color: var(--primary);
      font-size: 13px;
      font-weight: 500;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all var(--transition-normal) var(--transition-ease);
    }

    .toggle-comments-btn:hover {
      background: rgba(20, 184, 166, 0.05);
      color: var(--primary-dark);
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 300px;
      overflow-y: auto;
      margin-bottom: 12px;
      padding: 10px;
      background: var(--bg-secondary);
      direction: ltr !important; /* CRITICAL: Force LTR layout regardless of RTL context */
    }

    /* Comment Row - Full width container */
    .comment-row {
      display: flex !important;
      width: 100% !important;
      margin-bottom: 12px;
      position: relative;
      direction: ltr !important; /* CRITICAL: Force LTR direction regardless of RTL context */
    }

    /* RIGHT alignment for my comments */
    .comment-row.my-comment {
      justify-content: flex-end !important; /* Push to RIGHT edge */
    }

    /* LEFT alignment for others' comments */
    .comment-row:not(.my-comment) {
      justify-content: flex-start !important; /* Keep on LEFT edge */
    }
    
    /* Comment Unit - Holds name and bubble together */
    .comment-unit {
      display: flex !important;
      align-items: flex-start !important; /* Align name to TOP of bubble */
      gap: 8px; /* Exactly 8px gap between name and bubble */
      max-width: 85%;
      direction: ltr !important; /* CRITICAL: Force LTR direction regardless of RTL context */
      flex-direction: row !important; /* Force row direction for all units */
      padding: 0;
      margin: 0;
    }
    
    /* Others' comments: Name FIRST, then Bubble ([Name][Bubble]) */
    .comment-row:not(.my-comment) .comment-unit {
      /* Name on left, Bubble on right - HTML order must be [Name][Bubble] */
    }
    
    /* My comments: Bubble FIRST, then Name ([Bubble][Name]) */
    .my-comment .comment-unit {
      /* HTML order must be [Bubble][Name] */
    }

    /* Comment Bubble */
    .comment-bubble {
      padding: 10px 12px;
      position: relative;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      word-wrap: break-word;
      white-space: pre-wrap;
      max-width: 80%;
      direction: auto; /* Allow text direction to be determined by content */
    }

    /* Left bubble (other users) */
    .comment-row:not(.my-comment) .comment-bubble {
      background: white;
      color: var(--text-primary);
      border-radius: 0 12px 12px 12px;
    }

    /* Right bubble (my comments) */
    .my-comment .comment-bubble {
      background: rgb(20, 184, 166); /* Solid teal background */
      color: white; /* White text */
      border-radius: 12px 0 12px 12px;
    }

    /* Bubble tail for others' comments (pointing to left edge of screen) */
    .comment-row:not(.my-comment) .comment-bubble:before {
      content: '';
      position: absolute;
      top: 0;
      left: -8px;
      border-top: 8px solid white;
      border-right: 8px solid transparent;
      border-left: 0 solid transparent;
    }

    /* Bubble tail for my comments (pointing to right edge of screen) */
    .my-comment .comment-bubble:before {
      content: '';
      position: absolute;
      top: 0;
      right: -8px;
      border-top: 8px solid rgb(20, 184, 166); /* Match solid teal background */
      border-right: 0 solid transparent;
      border-left: 8px solid transparent;
    }

    /* Author name styling */
    .comment-author {
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      align-self: flex-start;
      padding: 0;
      margin: 0;
      line-height: 1;
    }

    /* Others' author name - LEFT side, touching left edge */
    .comment-row:not(.my-comment) .comment-author {
      color: var(--gray-600);
      order: 1; /* Places name BEFORE bubble */
    }

    /* My author name - RIGHT side, touching right edge */
    .my-comment .comment-author {
      color: var(--primary-dark);
      order: 2; /* Places name AFTER bubble */
    }

    /* Comment content */
    .comment-content {
      font-size: 14px;
      line-height: 1.4;
      direction: rtl; /* Ensure Hebrew text is readable */
    }

    /* Timestamp styling */
    .comment-time {
      font-size: 10px;
      margin-top: 4px;
      color: var(--text-tertiary);
      display: block;
    }

    /* My comment timestamp alignment */
    .my-comment .comment-time {
      text-align: left;
    }

    /* Others' comment timestamp alignment */
    .comment-row:not(.my-comment) .comment-time {
      text-align: right;
    }

    /* Input area */
    .add-comment-area {
      display: flex;
      align-items: center;
      margin-top: 10px;
    }

    .chat-input-form {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 8px;
      background: var(--bg-secondary);
      border-radius: 20px;
      padding: 4px 6px 4px 12px;
      border: 1px solid var(--border-light);
      transition: all var(--transition-normal) var(--transition-ease);
    }

    .chat-input-form:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.1);
    }

    .chat-input-form input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 8px 0;
      font-size: 14px;
      outline: none;
      color: var(--text-primary);
    }

    .chat-input-form button {
      border: none;
      background: var(--primary);
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-normal) var(--transition-ease);
    }

    .chat-input-form button:hover {
      background: var(--primary-dark);
      transform: scale(1.05);
    }

    .chat-input-form button:disabled {
      background: var(--gray-300);
      cursor: default;
      transform: none;
    }

    /* Empty states */
    .no-comments, .loading-text {
      text-align: center;
      padding: 16px 0;
      width: 100%;
      color: var(--text-tertiary);
      font-size: 14px;
      font-style: italic;
    }

    /* Animations */
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .animate-slideIn {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  encapsulation: ViewEncapsulation.None 
})
export class Comments implements OnInit {
  @Input() taskId!: string;
  
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
