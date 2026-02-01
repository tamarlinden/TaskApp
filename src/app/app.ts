import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from './services/auth';
import { Notifications } from './components/notifications/notifications';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, Notifications],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  private authService = inject(Auth);
  
  isLoggedIn = this.authService.isLoggedIn;
  currentUser = this.authService.currentUser;
  
  logout() {
    this.authService.logout();
  }
}