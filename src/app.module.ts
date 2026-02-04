import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LogModule } from './log/log.module';
import { ReportModule } from './report/report.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { UserProfileModule } from './user-profile/user-profile.module';
import { MenuModule } from './menu/menu.module';
import { VariableModule } from './variable/variable.module';
import { ReportPermissionModule } from './report-permission/report-permission.module';

@Module({
  imports: [
    DatabaseModule,
    LogModule,
    ReportModule,
    AuthModule,
    UserModule,
    UserProfileModule,
    MenuModule,
    VariableModule,
    ReportPermissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
