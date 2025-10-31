import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'SkillHub';
  isLoading = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Show loading spinner during route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isLoading = false;
      });
  }

  testClick(): void {
    console.log('Angular app is working correctly!');
  }
}
