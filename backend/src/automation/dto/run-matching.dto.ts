import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RunMatchingDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsInt()
  @Min(40)
  @Max(100)
  minimumScore = 60;
}
