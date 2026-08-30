import { Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('*path')
  async proxy(@Req() req: Request, @Res() res: Response) {
    await this.proxyService.handleRequest(req, res);
  }
}