import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class DateValidationPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata) {
    if (metadata.type != 'param') {
      return value;
    }

    if (new Date(value).toString() === 'Invalid Date') {
      throw new BadRequestException(`Wrong ${metadata.data} format`);
    }
    return value;
  }
}
