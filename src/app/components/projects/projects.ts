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
  styleUrls: ['./projects.css'],
})
export class Projects implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService); 
  private router = inject(Router);
  private location = inject(Location);
  private fb = inject(FormBuilder);

  // סיגנלים לניהול המצב של הרכיב
  projects = signal<Project[]>([]);
  showCreateForm = signal(false);
  submitted = signal(false); // סיגנל חדש לניהול מצב שליחת הטופס
  teamId: string | null = null;

  // הגדרת הטופס עם ולידציות
  projectForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]]
  });

  ngOnInit() {
    // שליפת ה-teamId מה-URL
    this.teamId = this.route.snapshot.paramMap.get('teamId');
    if (this.teamId) {
      this.loadProjects(this.teamId);
    }
  }

  // טעינת הפרויקטים השייכים לצוות
  loadProjects(id: string) {
    this.projectService.getProjectsByTeam(id).subscribe({
      next: (data) => {
        this.projects.set(data); 
      },
      error: (err) => {
        console.error('שגיאה בטעינת פרויקטים:', err);
      }
    });
  }

  // פתיחה/סגירה של טופס היצירה
  toggleCreateForm() {
    this.showCreateForm.set(!this.showCreateForm());
    this.submitted.set(false); // איפוס מצב השליחה כשסוגרים/פותחים מחדש
    this.projectForm.reset();
  }

  // יצירת פרויקט חדש
  createProject() {
    this.submitted.set(true); // סימון שהמשתמש ניסה לשלוח (מפעיל את הודעות השגיאה ב-HTML)

    if (this.projectForm.valid && this.teamId) {
      const projectData = {
        name: this.projectForm.value.name!,
        teamId: this.teamId
      };

      this.projectService.createProject(projectData).subscribe({
        next: (newProject) => {
          // עדכון הסיגנל עם הפרויקט החדש
          this.projects.set([...this.projects(), newProject]);
          
          // איפוס הטופס והמצב
          this.showCreateForm.set(false);
          this.submitted.set(false);
          this.projectForm.reset();
        },
        error: (err) => {
          console.error('שגיאה ביצירת פרויקט:', err);
          alert('לא ניתן היה ליצור את הפרויקט. אנא נסה שוב.');
        }
      });
    }
  }

  // ניווט ללוח המשימות של פרויקט ספציפי
  goToTasks(projectId: string) {
    this.router.navigate(['/tasks', projectId]);
  }

  // חזרה לעמוד הקודם
  goBack() {
    this.location.back();
  }
}