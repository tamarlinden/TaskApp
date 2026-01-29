import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task, CreateTaskData, UpdateTaskData } from '../models/task.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})

export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tasks`;
  
  getTasksByProject(projectId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}?projectId=${projectId}`);
  }

  getAllTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  createTask(taskData: CreateTaskData): Observable<Task> {
    // Convert from camelCase to snake_case for API
    const apiTaskData = {
      projectId: taskData.projectId,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      assignee_id: taskData.assigneeId,
      due_date: taskData.dueDate,
      order_index: taskData.orderIndex
    };
    return this.http.post<Task>(this.apiUrl, apiTaskData);
  }

  updateTask(id: string, taskData: UpdateTaskData): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, taskData);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
