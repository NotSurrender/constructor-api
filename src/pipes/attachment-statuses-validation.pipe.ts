import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { ProcurementAttachmentStatus } from "src/procurement/procurement.interface";

@Injectable()
export class AttachmentStatusesValidationPipe implements PipeTransform {
  transform(value: any): ProcurementAttachmentStatus[] {
    if (!value) return [];

    const values = Array.isArray(value) ? value : [value];

    const invalid = values.filter(
      (v) => !Object.values(ProcurementAttachmentStatus).includes(v)
    );

    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid attachmentStatuses: ${invalid.join(", ")}`
      );
    }

    return values as ProcurementAttachmentStatus[];
  }
}
