import { Injectable } from '@nestjs/common';
import {
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { ID_VALIDATION_ERROR } from 'src/common';

const PERIOD_REGEX = /(0?[1-9]|[1][0-2])\.[0-9]+/;

@ValidatorConstraint({ name: 'AllowedId', async: true })
@Injectable()
export class PeriodValidator implements ValidatorConstraintInterface {
  async validate(value: string): Promise<boolean> {
    return PERIOD_REGEX.test(value);
  }

  defaultMessage(): string {
    return ID_VALIDATION_ERROR;
  }
}

export const IsPeriod = (validationOptions?: ValidationOptions) => {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: PeriodValidator,
    });
  };
};
