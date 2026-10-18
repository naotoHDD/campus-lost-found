import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';

export class RecoveryMeetingDto {
  @ApiProperty({ example: 'Bibliothèque' })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({ format: 'date', example: '2026-10-05' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @ApiProperty({ example: '15:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  time!: string;
}

export class RecoveryCodeDto {
  @ApiProperty({ pattern: '^\\d{6}$', example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

export class RecoveryConfirmationDto {
  @ApiProperty({ enum: ['FINDER', 'CLAIMANT'] })
  @IsIn(['FINDER', 'CLAIMANT'])
  confirmation!: 'FINDER' | 'CLAIMANT';
}
