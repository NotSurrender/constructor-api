import { IsNumber, Min } from "class-validator";

export class WithdrawFromProjectDto {
  @IsNumber()
  @Min(1)
  readonly amount: number;
}
