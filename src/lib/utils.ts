import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : `${points}`;
}

export const ROBOT_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Aria&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bolt&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Luna&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Rusty&backgroundColor=ffd5dc',
];

export const BADGES = {
  ROBOT_MASTER: { id: 'robot-master', name: 'Robot Master', icon: '🤖', color: '#00FF9C' },
  CODING_KING: { id: 'coding-king', name: 'Coding King', icon: '💻', color: '#00E5FF' },
  AI_GENIUS: { id: 'ai-genius', name: 'AI Genius', icon: '🧠', color: '#FFE700' },
  BEST_BEHAVIOR: { id: 'best-behavior', name: 'Best Behavior', icon: '🌟', color: '#FF3D68' },
  ATTENDANCE_HERO: { id: 'attendance-hero', name: 'Attendance Hero', icon: '⏰', color: '#FFFFFF' },
};
