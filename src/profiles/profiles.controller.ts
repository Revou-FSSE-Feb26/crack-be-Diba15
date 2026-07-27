import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
@UseGuards(JwtAccessGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Patch()
  update(@GetCurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.profilesService.update(userId, dto);
  }
}
