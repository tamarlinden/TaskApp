import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TeamService } from '../../services/team'; 
import { UserService } from '../../services/user';
import { Team, User } from '../../models/task.model';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teams.html',
  styleUrl: './teams.css',
})
export class Teams implements OnInit {
  private teamService = inject(TeamService);
  private userService = inject(UserService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  teams = signal<Team[]>([]);
  users = signal<User[]>([]);
  showCreateForm = signal(false);
  showAddMemberForm = signal<string | null>(null);

  teamForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]]
  });

  memberForm = this.fb.group({
    userId: ['', [Validators.required]],
    role: ['member' as 'member' | 'admin', [Validators.required]]
  });

  ngOnInit() {
    this.loadTeams();
    this.loadUsers();
  }

  loadTeams() {
    this.teamService.getTeams().subscribe({
      next: (data) => this.teams.set(data), 
      error: (err) => console.error('שגיאה בטעינת צוותים', err)
    });
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('שגיאה בטעינת משתמשים', err)
    });
  }

  toggleCreateForm() {
    this.showCreateForm.set(!this.showCreateForm());
    this.teamForm.reset();
  }

  createTeam() {
    if (this.teamForm.valid) {
      const teamData = { name: this.teamForm.value.name! };
      
      this.teamService.createTeam(teamData).subscribe({
        next: (newTeam) => {
          this.teams.set([...this.teams(), newTeam]);
          this.showCreateForm.set(false);
          this.teamForm.reset();
        },
        error: (err) => {
          console.error('שגיאה ביצירת צוות', err);
          alert('שגיאה ביצירת צוות');
        }
      });
    }
  }

  toggleAddMemberForm(teamId: string | null) {
    this.showAddMemberForm.set(teamId);
    this.memberForm.reset();
  }

  addMember(teamId: string) {
    if (this.memberForm.valid) {
      const memberData = { 
        userId: this.memberForm.value.userId!,
        role: this.memberForm.value.role! 
      };
      
      this.teamService.addMember(teamId, memberData).subscribe({
        next: () => {
          this.showAddMemberForm.set(null);
          this.memberForm.reset({ role: 'member' });
          alert('חבר צוות נוסף בהצלחה!');
          this.loadTeams();
        },
        error: (err) => {
          console.error('שגיאה בהוספת חבר צוות', err);
          alert('שגיאה בהוספת חבר צוות. ' + (err.error?.message || 'אירעה שגיאה בהוספת המשתמש.'));
        }
      });
    }
  }

  goToProjects(teamId: string) {
    this.router.navigate(['/projects', teamId]);
  }
}