import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { Sort } from "src/common";

@Injectable()
export class SortValidationPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata) {
    if (value === undefined) {
      return value;
    }

    if (metadata.type != "param" && metadata.type != "query") {
      return value;
    }

    const isValidSort = Object.values(Sort).includes(+value as unknown as Sort);
    if (!isValidSort) {
      throw new BadRequestException(`Wrong ${metadata.data} format`);
    }
    return value;
  }
}
