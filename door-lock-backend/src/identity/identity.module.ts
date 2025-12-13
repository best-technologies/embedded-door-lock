import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../common/logger/logger.module';
import { AppConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/config.service';
import { EmailModule } from '../common/email/email.module';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    AppConfigModule,
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      useFactory: (configService: AppConfigService): JwtModuleOptions => {
        return {
          secret: configService.jwtSecret,
          signOptions: {
            expiresIn: configService.jwtExpiresIn as any,
          },
        };
      },
      inject: [AppConfigService],
    }),
  ],
  controllers: [IdentityController],
  providers: [IdentityService, JwtStrategy],
  exports: [IdentityService, JwtModule, PassportModule],
})
export class IdentityModule {}

