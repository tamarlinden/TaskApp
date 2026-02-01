import { CommonModule, Location } from '@angular/common';
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskService } from '../../services/task';
import { ProjectService } from '../../services/project';
import { TeamService } from '../../services/team';
import { Task, CreateTaskData, UpdateTaskData, User, Project } from '../../models/task.model';
import { Comments } from '../comments/comments';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Comments, CdkDrag, CdkDropList],
  templateUrl: './tasks.html',
  styleUrls: ['./tasks.css'],
})
export class Tasks implements OnInit {
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private teamService = inject(TeamService);
  private location = inject(Location);
  private fb = inject(FormBuilder);
  
  isLoading = signal(false);
  searchQuery = signal<string>('');

  tasks = signal<Task[]>([]);
  teamMembers = signal<User[]>([]);
  currentProject = signal<Project | null>(null);
  projectId: string | null = null;
  teamId: string | null = null;
  showCreateForm = signal(false);
  editingTask = signal<Task | null>(null);

  taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required]],
    status: ['backlog' as 'backlog' | 'in-progress' | 'done', [Validators.required]],
    priority: ['medium' as 'low' | 'medium' | 'high', [Validators.required]],
    assigneeId: [''],
    dueDate: [''],
    orderIndex: [0]
  });

  // Filter tasks based on search query
  filteredTasks = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.tasks();
    
    return this.tasks().filter(task => 
      task.title.toLowerCase().includes(query) || 
      task.description.toLowerCase().includes(query)
    );
  });

  todoTasks = computed(() => 
    this.filteredTasks().filter(task => task.status === 'backlog')
  );

  inProgressTasks = computed(() => 
    this.filteredTasks().filter(task => task.status === 'in-progress')
  );

  doneTasks = computed(() => 
    this.filteredTasks().filter(task => task.status === 'done')
  );

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    if (this.projectId) {
      this.loadProject(this.projectId);
      this.loadTasks(this.projectId);
    }
  }

  loadProject(projectId: string) {
    this.projectService.getProjectById(projectId).subscribe({
      next: (project) => {
        this.currentProject.set(project);
        this.teamId = project.team_id;
        this.loadTeamMembers(project.team_id);
      },
      error: (err) => console.error('שגיאה בטעינת פרויקט', err)
    });
  }

  loadTeamMembers(teamId: string) {
    this.teamService.getTeamMembers(teamId).subscribe({
      next: (members) => this.teamMembers.set(members),
      error: (err) => console.error('שגיאה בטעינת חברי צוות', err)
    });
  }

  loadTasks(id: string) {
    this.isLoading.set(true);
    this.taskService.getTasksByProject(id).subscribe({
      next: (data) => {
        this.tasks.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('שגיאה בטעינת משימות', err);
        this.isLoading.set(false);
      }
    });
  }

  toggleCreateForm() {
    this.showCreateForm.set(!this.showCreateForm());
    this.editingTask.set(null);
    this.taskForm.reset({
      status: 'backlog',
      priority: 'medium',
      orderIndex: 0
    });
  }

  createTask() {
    if (this.taskForm.valid && this.projectId) {
      const formValue = this.taskForm.value;
      const taskData: CreateTaskData = {
        title: formValue.title!,
        description: formValue.description!,
        status: formValue.status as 'backlog' | 'in-progress' | 'done',
        priority: formValue.priority as 'low' | 'medium' | 'high',
        projectId: this.projectId,
        assigneeId: formValue.assigneeId || undefined,
        dueDate: formValue.dueDate || undefined,
        orderIndex: formValue.orderIndex || 0
      };

      this.taskService.createTask(taskData).subscribe({
        next: (newTask) => {
          this.tasks.set([...this.tasks(), newTask]);
          this.showCreateForm.set(false);
          this.taskForm.reset({
            status: 'backlog',
            priority: 'medium',
            orderIndex: 0
          });
        },
        error: (err) => {
          console.error('שגיאה ביצירת משימה', err);
          alert('שגיאה ביצירת משימה');
        }
      });
    }
  }

  editTask(task: Task) {
    this.editingTask.set(task);
    this.showCreateForm.set(false);
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assignee_id || '',
      dueDate: task.due_date || '',
      orderIndex: task.order_index || 0
    });
  }

  updateTask() {
    const task = this.editingTask();
    if (this.taskForm.valid && task) {
      const formValue = this.taskForm.value;
      const updateData: UpdateTaskData = {
        title: formValue.title!,
        description: formValue.description!,
        status: formValue.status as 'backlog' | 'in-progress' | 'done',
        priority: formValue.priority as 'low' | 'medium' | 'high',
        assignee_id: formValue.assigneeId || undefined,
        due_date: formValue.dueDate || undefined,
        order_index: formValue.orderIndex || undefined
      };
      
      this.taskService.updateTask(task.id, updateData).subscribe({
        next: (updatedTask) => {
          this.tasks.set(
            this.tasks().map(t => t.id === updatedTask.id ? updatedTask : t)
          );
          this.editingTask.set(null);
          this.taskForm.reset({
            status: 'backlog',
            priority: 'medium',
            orderIndex: 0
          });
        },
        error: (err) => {
          console.error('שגיאה בעדכון משימה', err);
          alert('שגיאה בעדכון משימה');
        }
      });
    }
  }

  deleteTask(taskId: string) {
    if (confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          this.tasks.set(this.tasks().filter(t => t.id !== taskId));
        },
        error: (err) => {
          console.error('שגיאה במחיקת משימה', err);
          alert('שגיאה במחיקת משימה');
        }
      });
    }
  }

  cancelEdit() {
    this.editingTask.set(null);
    this.taskForm.reset({
      status: 'backlog',
      priority: 'medium',
      orderIndex: 0
    });
  }

  goBack() {
    this.location.back();
  }

  getAssigneeName(assigneeId: string): string {
    const member = this.teamMembers().find(m => m.id === assigneeId);
    return member ? member.name : 'לא הוקצה';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  }
  
  updateSearchQuery(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onDrop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      // Reordering within the same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving to a different column
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      // Update the task status based on the new container
      const task = event.container.data[event.currentIndex];
      let newStatus: 'backlog' | 'in-progress' | 'done';
      
      if (event.container.id === 'todoList') {
        newStatus = 'backlog';
      } else if (event.container.id === 'inProgressList') {
        newStatus = 'in-progress';
      } else {
        newStatus = 'done';
      }
      
      // Only update if status has changed
      if (task.status !== newStatus) {
        const updateData: UpdateTaskData = { status: newStatus };
        this.taskService.updateTask(task.id, updateData).subscribe({
          next: (updatedTask) => {
            // Update the task in our local array with the returned data
            this.tasks.set(
              this.tasks().map(t => t.id === updatedTask.id ? updatedTask : t)
            );
          },
          error: (err) => {
            console.error('שגיאה בעדכון סטטוס משימה', err);
            // Reload tasks to restore the original state
            if (this.projectId) {
              this.loadTasks(this.projectId);
            }
          }
        });
      }
    }
  }
}
