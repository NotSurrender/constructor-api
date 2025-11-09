import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";

const OPERATION_TYPES = ["investition", "withdrawal", "transfer"];

@Injectable()
export class OperationTypeValidationPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata) {
    if (metadata.type != "param") {
      return value;
    }

    if (!OPERATION_TYPES.includes(value)) {
      throw new BadRequestException(`Wrong operation type`);
    }
    return value;
  }
}
