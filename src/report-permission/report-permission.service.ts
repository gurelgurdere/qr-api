import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReportPermission } from './report-permission.model';

// Reports menu group ID (constant)
const REPORTS_MENU_GROUP_ID = 2;

// Permission type for insert
const PERMISSION_TYPE_GRANTED = 1;

// Content language IDs
const LANG_TR = 1;
const LANG_EN = 2;

@Injectable()
export class ReportPermissionService {
  private readonly logger = new Logger(ReportPermissionService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getPermissionsByUserProfile(
    userProfileId: number,
    contentLanguageId: number,
  ): Promise<ReportPermission[]> {
    const sql = `
      SELECT 
        mi.menuItemId,
        (SELECT mia.descr 
         FROM qrMenuItemName mia 
         WHERE mia.menuItemId = mi.menuItemId 
         AND mia.contentLanguageId = ?) AS menuItemName,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM qrMenuItemPermission mip 
            WHERE mip.menuItemId = mi.menuItemId 
            AND mip.userProfileId = ?
          ) THEN 1 
          ELSE 0 
        END AS permissionType
      FROM qrMenuItem mi
      WHERE mi.menuGroupId = ?
      ORDER BY mi.priority
    `;

    return this.databaseService.query<ReportPermission>(sql, [
      contentLanguageId,
      userProfileId,
      REPORTS_MENU_GROUP_ID,
    ]);
  }

  async savePermissions(
    userProfileId: number,
    menuItemIds: number[],
  ): Promise<void> {
    const connection = await this.databaseService.beginTransaction();

    try {
      // Delete existing permissions for this user profile (only for report menu items)
      const deleteSql = `
        DELETE FROM qrMenuItemPermission 
        WHERE userProfileId = ? 
        AND menuItemId IN (
          SELECT menuItemId FROM qrMenuItem WHERE menuGroupId = ?
        )
      `;
      await this.databaseService.execute(
        deleteSql,
        [userProfileId, REPORTS_MENU_GROUP_ID],
        connection,
      );

      // Insert new permissions
      if (menuItemIds.length > 0) {
        const insertSql = `
          INSERT INTO qrMenuItemPermission (menuItemId, userProfileId, permissionType)
          VALUES (?, ?, ?)
        `;

        for (const menuItemId of menuItemIds) {
          await this.databaseService.execute(
            insertSql,
            [menuItemId, userProfileId, PERMISSION_TYPE_GRANTED],
            connection,
          );
        }
      }

      await this.databaseService.commit(connection);

      this.logger.log(
        `Permissions saved for userProfileId: ${userProfileId}, menuItemIds: [${menuItemIds.join(', ')}]`,
      );
    } catch (error) {
      await this.databaseService.rollback(connection);
      this.logger.error(`Failed to save permissions: ${error.message}`);
      throw error;
    }
  }
}
