import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Header } from './shared/components/header/header';
import { BottomNav } from './shared/components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, BottomNav],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  isAdminRoute = false;
  constructor(router: Router) {
    this.isAdminRoute = router.url.startsWith('/admin');
    router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      this.isAdminRoute = (event as NavigationEnd).urlAfterRedirects.startsWith('/admin');
    });
  }
}
