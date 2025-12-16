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
      description: 'Guessed first single choice question.',
      spriteCol: 0,
      spriteRow: 0
    },
    {
      id: 2,
      title: 'Lucky Guess',
      description: 'Guessed first multi choice question.',
      spriteCol: 1,
      spriteRow: 0
    },
    {
      id: 3,
      title: 'You Did the Thing',
      description: 'Guessed first type question.',
      spriteCol: 2,
      spriteRow: 0
    },
    {
      id: 4,
      title: 'Easy Peasy',
      description: 'Guessed all easy questions.',
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
      description: 'Guessed 10 single choice questions.',
      spriteCol: 5,
      spriteRow: 0
    },
    {
      id: 7,
      title: 'Brain Overload',
      description: 'Guessed 10 multi choice questions.',
      spriteCol: 6,
      spriteRow: 0
    },
    {
      id: 8,
      title: 'Keyboard Warrior',
      description: 'Guessed 10 type questions.',
      spriteCol: 0,
      spriteRow: 1
    },
    {
      id: 9,
      title: 'Decent Decent',
      description: 'Guessed 10 questions.',
      spriteCol: 1,
      spriteRow: 1
    },
    {
      id: 10,
      title: 'Getting There',
      description: 'Guessed all medium questions.',
      spriteCol: 2,
      spriteRow: 1
    },
    {
      id: 11,
      title: 'Clickety Click',
      description: 'Guessed 25 single choice questions.',
      spriteCol: 3,
      spriteRow: 1
    },
    {
      id: 12,
      title: 'Analysis Paralysis',
      description: 'Guessed 25 multi choice questions.',
      spriteCol: 4,
      spriteRow: 1
    },
    {
      id: 13,
      title: 'Type Master',
      description: 'Guessed 25 type questions.',
      spriteCol: 5,
      spriteRow: 1
    },
    {
      id: 14,
      title: 'Century Club',
      description: 'Guessed 100 questions.',
      spriteCol: 6,
      spriteRow: 1
    },
    {
      id: 15,
      title: 'Code Wizard',
      description: 'Guessed all code-based questions.',
      spriteCol: 0,
      spriteRow: 2
    },
    {
      id: 16,
      title: 'Book Smarts',
      description: 'Guessed all theoretical questions.',
      spriteCol: 1,
      spriteRow: 2
    },
    {
      id: 17,
      title: 'Single Threat',
      description: 'Guessed all single choice questions.',
      spriteCol: 2,
      spriteRow: 2
    },
    {
      id: 18,
      title: 'Multiple Personality',
      description: 'Guessed all multi choice questions.',
      spriteCol: 3,
      spriteRow: 2
    },
    {
      id: 19,
      title: 'Type Champion',
      description: 'Guessed all type questions.',
      spriteCol: 4,
      spriteRow: 2
    },
    {
      id: 20,
      title: 'Masochist',
      description: 'Guessed all hard questions correctly.',
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
    const x = col * -100;
    const y = row * -100;
    return `${x}px ${y}px`;
  }
}