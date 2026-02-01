import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment, CreateCommentData } from '../models/task.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/comments`;

  getTaskComments(taskId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}?taskId=${taskId}`);
  }

  getCommentsByTask(taskId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}?taskId=${taskId}`);
  }

  getCommentById(id: string): Observable<Comment> {
    return this.http.get<Comment>(`${this.apiUrl}/${id}`);
  }

  createComment(commentData: CreateCommentData): Observable<Comment> {
    const apiData = {
      body: commentData.body,
      taskId: commentData.taskId
    };
    return this.http.post<Comment>(this.apiUrl, apiData);
  }

  updateComment(id: string, body: string): Observable<Comment> {
    return this.http.patch<Comment>(`${this.apiUrl}/${id}`, { body });
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
