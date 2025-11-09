import { IsNumber, Min } from "class-validator";
import { IsId } from "src/validators/id.validator";

export class UpdateSupplyProcurementDto {
  @IsId()
  readonly _id: string;

  @IsNumber()
  @Min(1)
  readonly number: number;

  @IsNumber()
  @Min(1)
  readonly quantity: number;

  @IsNumber()
  readonly quantityAttached: number;

  @IsNumber()
  @Min(1)
  readonly quantityAvailable: number;

  @IsNumber()
  @Min(1)
  readonly costPrice: number;
}
