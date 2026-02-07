import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class ChoiceDto {
  @IsOptional()
  id?: number;

  @IsString()
  choiceText: string;

  @IsBoolean()
  isGood: boolean;

  @IsOptional()
  @IsString()
  explanation?: string | null;
}
