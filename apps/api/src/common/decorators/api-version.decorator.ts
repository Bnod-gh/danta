import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ApiVersionMeta {
  version: string;
}

export const ApiVersion = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const path: string = request.url ?? request.route?.path ?? '';

    const match = path.match(/\/api\/v(\d+)/);

    return match ? `v${match[1]}` : 'v1';
  },
);

export const API_VERSION_METADATA_KEY = 'api:version';

export const SetApiVersion = (version: string) =>
  (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(API_VERSION_METADATA_KEY, version, descriptor.value);
    }
  };
