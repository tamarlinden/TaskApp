import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Team, CreateTeamData, AddMemberData, User } from '../models/task.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeamService { 
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/teams`;

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(this.apiUrl);
  }

  createTeam(teamData: CreateTeamData): Observable<Team> {
    return this.http.post<Team>(this.apiUrl, teamData);
  }

  addMember(teamId: string, memberData: AddMemberData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${teamId}/members`, memberData);
  }
  
  getTeamMembers(teamId: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${teamId}/members`);
  }
}