import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('Profiles')
@ApiBearerAuth('JWT-auth')
@Controller('profiles')
@UseGuards(JwtAccessGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Patch()
  @ApiOperation({ summary: 'Memperbarui profil pengguna (bio, sosmed, avatar, status komisi)' })
  @ApiResponse({ status: 200, description: 'Profil berhasil diperbarui' })
  update(@GetCurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.profilesService.update(userId, dto);
  }
}
