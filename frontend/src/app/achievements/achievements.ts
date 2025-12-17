import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AchievementsService } from '../services/achievements.service';

interface Achievement {
  id: number;
  title: string;
  description: string;
  sprite_col: number;
  sprite_row: number;
  created_at: string;
}

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './achievements.html',
  styleUrls: ['./achievements.css']
})
export class AchievementsComponent implements OnInit {
  achievements: Achievement[] = [];
  loading = true;
  error: string | null = null;

  constructor(private achievementsService: AchievementsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadAchievements();
  }

  loadAchievements(): void {
    this.achievementsService.getAllAchievements().subscribe({
      next: (data) => {
        this.achievements = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading achievements:', err);
        this.error = 'Failed to load achievements: ' + (err.message || err.status);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getBackgroundPosition(col: number, row: number): string {
    const x = col * -80;
    const y = row * -80;
    return `${x}px ${y}px`;
  }
}