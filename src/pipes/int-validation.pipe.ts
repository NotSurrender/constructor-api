import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";

@Injectable()
export class IntValidationPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata) {
    if (metadata.type != "param") {
      return value;
    }

    if (Number.isInteger(value)) {
      throw new BadRequestException(`Wrong int format`);
    }
    return value;
  }
}
