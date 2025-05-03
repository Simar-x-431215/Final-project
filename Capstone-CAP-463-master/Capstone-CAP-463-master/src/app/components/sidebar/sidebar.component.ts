import { Component, HostListener, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  isExpanded: boolean = true;
  isMobile: boolean = false;
  
  @Output() sidebarStateChanged = new EventEmitter<boolean>();

  constructor() {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    const prevIsMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    
    // If switching from mobile to desktop, always expand the sidebar
    if (prevIsMobile && !this.isMobile) {
      this.isExpanded = true;
      this.sidebarStateChanged.emit(this.isExpanded);
    }
    
    // If switching from desktop to mobile, collapse the sidebar
    if (!prevIsMobile && this.isMobile) {
      this.isExpanded = false;
      this.sidebarStateChanged.emit(this.isExpanded);
    }
  }

  toggleSidebar(): void {
    // Only toggle on mobile
    if (this.isMobile) {
      this.isExpanded = !this.isExpanded;
      this.sidebarStateChanged.emit(this.isExpanded);
    }
  }
}
