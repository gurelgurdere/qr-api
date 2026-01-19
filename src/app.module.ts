import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ReportModule } from './report/report.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { UserProfileModule } from './user-profile/user-profile.module';
import { MenuModule } from './menu/menu.module';

@Module({
  imports: [
    DatabaseModule,
    ReportModule,
    AuthModule,
    UserModule,
    UserProfileModule,
    MenuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
