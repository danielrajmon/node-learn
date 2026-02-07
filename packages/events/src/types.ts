/**
 * Event Types & Schema
 * All microservices publish/subscribe to these event types via NATS
 */

export type EventType =
  | 'answer.submitted'
  | 'answer.submission.failed'
  | 'achievement.check'
  | 'achievement.unlocked'
  | 'leaderboard.update'
  | 'question.created'
  | 'question.updated'
  | 'question.deleted'
  | 'user.login'
  | 'user.role.updated';

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
  userId: string | number;
  questionId: number;
  selectedChoiceId?: number;
  quizModeId?: string;
  isCorrect: boolean;
  timestamp: string;
  correlationId: string;
  questionType?: string;
  practical?: boolean;
  difficulty?: string;
}

export interface AnswerSubmissionFailedPayload {
  userId: string | number;
  questionId: number;
  error: string;
  correlationId: string;
}

export interface AchievementCheckPayload {
  userId: string | number;
  questionId: number;
  quizModeId?: string;
  correlationId: string;
}

export interface AchievementUnlockedPayload {
  userId: string | number;
  achievementId: number | string;
  achievementTitle: string;
}

export interface LeaderboardUpdatePayload {
  userId: string | number;
  quizModeId?: string;
  correlationId: string;
}

export interface QuestionCreatedPayload {
  correlationId: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface QuestionUpdatedPayload {
  correlationId: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface QuestionDeletedPayload {
  correlationId: string;
  timestamp: string;
  data: { id: number };
}

export interface UserLoginPayload {
  userId: number;
  googleId: string;
  email: string;
  name: string;
  isAdmin: boolean;
  provider: string;
}

export interface UserRoleUpdatedPayload {
  correlationId: string;
  timestamp: string;
  data: { userId: number; isAdmin: boolean };
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
  ANSWER_SUBMISSION_FAILED: 'answer.submission.failed',
  ACHIEVEMENT_CHECK: 'achievement.check',
  ACHIEVEMENT_UNLOCKED: 'achievement.unlocked',
  LEADERBOARD_UPDATE: 'leaderboard.update',
  QUESTION_CREATED: 'question.created',
  QUESTION_UPDATED: 'question.updated',
  QUESTION_DELETED: 'question.deleted',
  USER_LOGIN: 'user.login',
  USER_ROLE_UPDATED: 'user.role.updated',
} as const;

/**
 * Saga Compensation Subjects
 * For saga pattern - services acknowledge event processing
 */
export const SAGA_COMPENSATION_SUBJECT = (correlationId: string) =>
  `compensation.${correlationId}`;
