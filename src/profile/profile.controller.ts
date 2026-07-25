import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAccessGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Patch()
  update(@GetCurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.profileService.update(userId, dto);
  }
}
