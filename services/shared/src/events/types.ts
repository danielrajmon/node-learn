/**
 * Event Types & Schema
 * All microservices publish/subscribe to these event types via NATS
 */

export type EventType =
  | 'answer.submitted'
  | 'answer_submission.failed'
  | 'achievement.earned'
  | 'achievement.check_failed'
  | 'leaderboard.entry.updated'
  | 'question.created'
  | 'question.updated'
  | 'question.deleted'
  | 'user.created'
  | 'user.authenticated'
  | 'user.stats.reset';

/**
 * Base domain event structure
 * Every event published to NATS must conform to this shape
 */
export interface DomainEvent<T = any> {
  id: string; // UUID - unique event ID
  type: EventType;
  aggregateId: string; // Primary entity ID (userId, questionId, etc.)
  aggregateType: string; // 'user', 'question', 'answer', etc.
  payload: T;
  timestamp: Date;
  version: number; // For event versioning/schema evolution
  correlationId: string; // Trace requests across services
  causationId?: string; // Link to parent event (for sagas)
  serviceId: string; // Which service published this
}

/**
 * Specific Event Payloads
 */

export interface AnswerSubmittedPayload {
  userId: string;
  questionId: string;
  userAnswer: string; // User's response
  isCorrect: boolean;
  streak: number; // Current correct answer streak
  quizModeId?: string;
  attemptedAt: Date;
}

export interface AchievementEarnedPayload {
  userId: string;
  achievementId: string;
  title: string;
  description: string;
  earnedAt: Date;
}

export interface AchievementCheckFailedPayload {
  userId: string;
  correlationId: string; // Link to original answer submission
  reason: string;
  failedAt: Date;
}

export interface LeaderboardEntryUpdatedPayload {
  quizModeId: string;
  userId: string;
  position: number; // 1-6
  correctAnswers: number;
  totalQuestions: number;
  streak: number;
  updatedAt: Date;
}

export interface QuestionCreatedPayload {
  questionId: string;
  text: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'single_choice' | 'multiple_choice' | 'text_input';
  isPractical: boolean;
  createdAt: Date;
  createdBy: string; // Admin user ID
}

export interface QuestionUpdatedPayload {
  questionId: string;
  changes: Record<string, any>; // What fields changed
  updatedAt: Date;
  updatedBy: string; // Admin user ID
}

export interface QuestionDeletedPayload {
  questionId: string;
  deletedAt: Date;
  deletedBy: string; // Admin user ID
}

export interface UserCreatedPayload {
  userId: string;
  email: string;
  name: string;
  googleId?: string;
  picture?: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface UserAuthenticatedPayload {
  userId: string;
  email: string;
  authenticatedAt: Date;
  tokenExpiresAt: Date;
}

export interface UserStatsResetPayload {
  userId: string; // Usually 'guest-user'
  reason: 'daily_reset' | 'admin_reset';
  resetAt: Date;
}

/**
 * Event Store Entry (persisted in database)
 * This is what gets stored for event sourcing
 */
export interface StoredEvent {
  id: string;
  eventType: EventType;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, any>;
  metadata: {
    timestamp: Date;
    version: number;
    correlationId: string;
    causationId?: string;
    serviceId: string;
    userId?: string; // Actor who caused the event
  };
  createdAt: Date;
}

/**
 * NATS Subject Naming Convention
 * Format: domain.action
 * Examples: answer.submitted, achievement.earned, question.updated
 */
export const NATS_SUBJECTS = {
  ANSWER_SUBMITTED: 'answer.submitted',
  ANSWER_SUBMISSION_FAILED: 'answer_submission.failed',
  ACHIEVEMENT_EARNED: 'achievement.earned',
  ACHIEVEMENT_CHECK_FAILED: 'achievement.check_failed',
  LEADERBOARD_ENTRY_UPDATED: 'leaderboard.entry.updated',
  QUESTION_CREATED: 'question.created',
  QUESTION_UPDATED: 'question.updated',
  QUESTION_DELETED: 'question.deleted',
  USER_CREATED: 'user.created',
  USER_AUTHENTICATED: 'user.authenticated',
  USER_STATS_RESET: 'user.stats.reset',
} as const;

/**
 * Saga Compensation Subjects
 * For saga pattern - services acknowledge event processing
 */
export const SAGA_COMPENSATION_SUBJECT = (correlationId: string) =>
  `compensation.${correlationId}`;
