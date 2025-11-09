import { IsString, MaxLength, IsNotEmpty } from "class-validator";
import { IsColor } from "src/validators/color.validator";
import { PROJECT_COLORS } from "../project.constants";

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly name: string;

  @IsColor()
  readonly color: (typeof PROJECT_COLORS)[number];
}
