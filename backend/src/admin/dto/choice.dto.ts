import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class ChoiceDto {
  @ApiProperty({
    example: 1,
    description: 'Choice ID',
    required: false,
  })
  @IsOptional()
  id?: number;

  @ApiProperty({
    example: 'Encapsulation',
    description: 'The choice text',
  })
  @IsString()
  choiceText: string;

  @ApiProperty({
    example: true,
    description: 'Whether this is a correct answer',
    default: false,
  })
  @IsBoolean()
  isGood: boolean;
}
