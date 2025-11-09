import {
  IsString,
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsNumber,
} from "class-validator";
import { IsColor } from "src/validators/color.validator";
import { PROJECT_COLORS } from "../project.constants";

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly name?: string;

  @IsOptional()
  @IsColor()
  readonly color?: (typeof PROJECT_COLORS)[number];

  @IsOptional()
  @IsArray()
  @IsNumber(undefined, { each: true })
  @ArrayMinSize(1)
  readonly goodIds?: number[];
}
