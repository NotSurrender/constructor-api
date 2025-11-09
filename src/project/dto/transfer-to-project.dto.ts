import { IsNumber, Max, Min } from "class-validator";
import { IsId } from "src/validators/id.validator";

export class TransferToProjectDto {
  @IsId()
  readonly projectId: string;

  @IsNumber()
  @Min(1)
  @Max(99999999)
  readonly amount: number;
}
