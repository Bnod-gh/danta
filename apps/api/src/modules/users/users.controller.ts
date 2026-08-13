import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @RequirePermissions('users:manage')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.usersService.findById(user.tenantId, id);
  }
}
