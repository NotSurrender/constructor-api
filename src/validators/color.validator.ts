import { Injectable } from "@nestjs/common";
import {
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from "class-validator";
import { COLOR_VALIDATION_ERROR } from "src/common";
import { PROJECT_COLORS } from "src/project/project.constants";

@ValidatorConstraint({ name: "AllowedColor", async: true })
@Injectable()
export class ColorValidator implements ValidatorConstraintInterface {
  async validate(value: (typeof PROJECT_COLORS)[number]): Promise<boolean> {
    return PROJECT_COLORS.includes(value);
  }

  defaultMessage(): string {
    return COLOR_VALIDATION_ERROR;
  }
}

export const IsColor = (validationOptions?: ValidationOptions) => {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ColorValidator,
    });
  };
};
