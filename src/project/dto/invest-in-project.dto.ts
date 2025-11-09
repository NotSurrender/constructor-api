import { IsNumber, Max, Min } from "class-validator";

export class InvestInProjectDto {
  @IsNumber()
  @Min(1)
  @Max(99999999)
  readonly amount: number;
}
