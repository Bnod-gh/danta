import { Module } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

@Module({})
export class SwaggerModuleSetup {
  static setup(app: any) {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder()
      .setTitle('Danta API')
      .setDescription('Australian Dental Practice Management SaaS API')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
    );
    SwaggerModule.setup('api/docs', app, document);
  }
}
