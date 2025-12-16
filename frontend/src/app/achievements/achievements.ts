import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Achievement {
  id: number;
  title: string;
  description: string;
  spriteCol: number;
  spriteRow: number;
}

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './achievements.html',
  styleUrls: ['./achievements.css']
})
export class AchievementsComponent {
  achievements: Achievement[] = [
    {
      id: 1,
      title: 'First Steps',
      description: 'Answered your first single choice question.',
      spriteCol: 0,
      spriteRow: 0
    },
    {
      id: 2,
      title: 'Lucky Guess',
      description: 'Answered your first multi-choice question.',
      spriteCol: 1,
      spriteRow: 0
    },
    {
      id: 3,
      title: 'You Did the Thing',
      description: 'Answered your first text input question.',
      spriteCol: 2,
      spriteRow: 0
    },
    {
      id: 4,
      title: 'Easy Peasy',
      description: 'Mastered all easy-level questions.',
      spriteCol: 3,
      spriteRow: 0
    },
    {
      id: 5,
      title: 'Redemption Arc',
      description: 'Answered a previously missed question correctly.',
      spriteCol: 4,
      spriteRow: 0
    },
    {
      id: 6,
      title: 'Click Clicker',
      description: 'Answered 10 single choice questions correctly.',
      spriteCol: 5,
      spriteRow: 0
    },
    {
      id: 7,
      title: 'Brain Overload',
      description: 'Answered 10 multi-choice questions correctly.',
      spriteCol: 6,
      spriteRow: 0
    },
    {
      id: 8,
      title: 'Keyboard Warrior',
      description: 'Answered 10 text input questions correctly.',
      spriteCol: 0,
      spriteRow: 1
    },
    {
      id: 9,
      title: 'X Marks the Spot',
      description: 'Answered 10 questions correctly.',
      spriteCol: 1,
      spriteRow: 1
    },
    {
      id: 10,
      title: 'Getting There',
      description: 'Mastered all medium-level questions.',
      spriteCol: 2,
      spriteRow: 1
    },
    {
      id: 11,
      title: 'Clickety Click',
      description: 'Answered 25 single choice questions correctly.',
      spriteCol: 3,
      spriteRow: 1
    },
    {
      id: 12,
      title: 'Choice Champion',
      description: 'Answered 25 multi-choice questions correctly.',
      spriteCol: 4,
      spriteRow: 1
    },
    {
      id: 13,
      title: 'Type Master',
      description: 'Answered 25 text input questions correctly.',
      spriteCol: 5,
      spriteRow: 1
    },
    {
      id: 14,
      title: 'Quiz Legend',
      description: 'Answered 100 questions correctly.',
      spriteCol: 6,
      spriteRow: 1
    },
    {
      id: 15,
      title: 'Code Wizard',
      description: 'Mastered all code-based questions.',
      spriteCol: 0,
      spriteRow: 2
    },
    {
      id: 16,
      title: 'Book Smarts',
      description: 'Mastered all theoretical questions.',
      spriteCol: 1,
      spriteRow: 2
    },
    {
      id: 17,
      title: 'Single Threat',
      description: 'Mastered all single choice questions.',
      spriteCol: 2,
      spriteRow: 2
    },
    {
      id: 18,
      title: 'Multiple Personality',
      description: 'Mastered all multi-choice questions.',
      spriteCol: 3,
      spriteRow: 2
    },
    {
      id: 19,
      title: 'Type Champion',
      description: 'Mastered all text input questions.',
      spriteCol: 4,
      spriteRow: 2
    },
    {
      id: 20,
      title: 'Masochist',
      description: 'Completed all hard-level questions.',
      spriteCol: 5,
      spriteRow: 2
    },
    {
      id: 21,
      title: 'NodeJS Ninja',
      description: 'You are now well prepared for a NodeJS interview!',
      spriteCol: 6,
      spriteRow: 2
    },
  ];

  getBackgroundPosition(col: number, row: number): string {
    const x = col * -80;
    const y = row * -80;
    return `${x}px ${y}px`;
  }
}