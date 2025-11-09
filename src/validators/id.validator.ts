import { Injectable } from '@nestjs/common';
import {
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { Types } from 'mongoose';
import { ID_VALIDATION_ERROR } from 'src/common';

@ValidatorConstraint({ name: 'AllowedId', async: true })
@Injectable()
export class IdValidator implements ValidatorConstraintInterface {
  async validate(value: string): Promise<boolean> {
    return Types.ObjectId.isValid(value);
  }

  defaultMessage(): string {
    return ID_VALIDATION_ERROR;
  }
}

export const IsId = (validationOptions?: ValidationOptions) => {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IdValidator,
    });
  };
};
