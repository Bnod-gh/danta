import { Injectable, ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { ParseIntPipe } from '@nestjs/common';

@Injectable()
export class OptionalParseIntPipe implements PipeTransform {
  private readonly pipe: ParseIntPipe;

  constructor() {
    this.pipe = new ParseIntPipe({ optional: true });
  }

  async transform(value: unknown, _metadata: ArgumentMetadata) {
    if (value === '' || value == null) {
      return undefined;
    }
    if (typeof value === 'string') {
      return this.pipe.transform(value, _metadata);
    }
    return undefined;
  }
}
