import { CommonModule, Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProjectService } from '../../services/project'; 
import { Project } from '../../models/task.model';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService); 
  private router = inject(Router);
  private location = inject(Location);
  private fb = inject(FormBuilder);

  projects = signal<Project[]>([]);
  teamId: string | null = null;
  showCreateForm = signal(false);

  projectForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]]
  });

  ngOnInit() {
    this.teamId = this.route.snapshot.paramMap.get('teamId');
    if (this.teamId) {
      this.loadProjects(this.teamId);
    }
  }

  loadProjects(id: string) {
    this.projectService.getProjectsByTeam(id).subscribe({
      next: (data) => {
        this.projects.set(data); 
      },
      error: (err) => console.error('שגיאה בטעינת פרויקטים', err)
    });
  }

  toggleCreateForm() {
    this.showCreateForm.set(!this.showCreateForm());
    this.projectForm.reset();
  }

  createProject() {
    if (this.projectForm.valid && this.teamId) {
      const projectData = {
        name: this.projectForm.value.name!,
        teamId: this.teamId
      };
      this.projectService.createProject(projectData).subscribe({
        next: (newProject) => {
          this.projects.set([...this.projects(), newProject]);
          this.showCreateForm.set(false);
          this.projectForm.reset();
        },
        error: (err) => {
          console.error('שגיאה ביצירת פרויקט', err);
          alert('שגיאה ביצירת פרויקט');
        }
      });
    }
  }

  goToTasks(projectId: string) {
    this.router.navigate(['/tasks', projectId]);
  }
  goBack() {
    this.location.back();
  }
}