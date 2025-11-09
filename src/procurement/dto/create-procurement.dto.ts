import {
  IsNumber,
  IsOptional,
  Min,
  IsDateString,
  Max,
  IsString,
  IsNotEmpty,
  MaxLength,
} from "class-validator";

export class CreateProcurementDto {
  @IsDateString()
  readonly date: string;

  @IsNumber()
  @Min(1)
  @Max(9999999)
  readonly amount: number;

  @IsNumber()
  @Min(1)
  @Max(999)
  readonly quantity: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly goodName?: string;

  @IsOptional()
  @IsDateString()
  readonly logisticsDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9999999)
  readonly logisticsAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9999999)
  readonly logisticsOtherExpenses?: number;

  @IsOptional()
  @IsDateString()
  readonly fulfillmentDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9999999)
  readonly fulfillmentPricePerUnit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(999)
  readonly fulfillmentQuantity?: number;

  @IsOptional()
  @IsNumber()
  readonly goodArticle?: number;
}
