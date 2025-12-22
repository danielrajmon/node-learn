import { Injectable } from '@nestjs/common';

export interface QuizMode {
  id: string;
  name: string;
  description: string;
  filters: any;
}

@Injectable()
export class QuizService {
  constructor() {}

  async getQuizModes(): Promise<QuizMode[]> {
    // For now, return the modes directly from the database query
    // This will be called and the query executed by the controller
    return [];
  }
}
