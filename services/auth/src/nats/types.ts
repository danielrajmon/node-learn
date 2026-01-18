export type EventType = 
  | 'user.created'
  | 'user.login'
  | 'user.logout'
  | 'answer.submitted'
  | 'achievement.unlocked'
  | 'leaderboard.updated'
  | 'question.created';

export interface DomainEvent<T = any> {
  id: string;
  type: EventType;
  aggregateId: string;
  aggregateType: string;
  payload: T;
  timestamp: Date;
  version: number;
  correlationId: string;
  causationId?: string;
  serviceId: string;
}

export const NATS_SUBJECTS = {
  USER_CREATED: 'user.created',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  ANSWER_SUBMITTED: 'answer.submitted',
  ACHIEVEMENT_UNLOCKED: 'achievement.unlocked',
  LEADERBOARD_UPDATED: 'leaderboard.updated',
  QUESTION_CREATED: 'question.created',
};
