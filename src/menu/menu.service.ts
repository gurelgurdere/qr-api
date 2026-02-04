import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  DatabaseService,
  TransactionConnection,
} from '../database/database.service';
import { Menu, MenuGroup, MenuItem, MenuItemRow } from './menu.model';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

// Reports menu group ID (constant)
const REPORTS_MENU_GROUP_ID = 2;

// Content language IDs
const LANG_TR = 1;
const LANG_EN = 2;

interface NextValues {
  nextItemCode: number;
  nextPriority: number;
}

interface ReportMenuItem {
  menuItemId: number;
  tr: string;
  en: string;
  itemCode: string;
  itemUri: string;
  priority: number;
  active: number;
}

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getMenuByUserProfile(
    contentLanguageId: number,
    userProfileId: number,
  ): Promise<Menu> {
    const rows = await this.fetchMenuItems(contentLanguageId, userProfileId);
    return this.transformToMenu(rows);
  }

  async createMenuItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    const connection = await this.databaseService.beginTransaction();

    try {
      // Check if reportId already exists
      const existingItem = await this.findMenuItemByUri(
        `/report/${dto.reportId}`,
        connection,
      );
      if (existingItem) {
        throw new ConflictException(
          `Menu item with reportId '${dto.reportId}' already exists`,
        );
      }

      // Get next itemCode and priority values
      const nextValues = await this.getNextValues(connection);

      // Insert into qrMenuItem
      const menuItemId = await this.insertMenuItem(
        dto.reportId,
        nextValues,
        connection,
      );

      // Insert Turkish name
      await this.insertMenuItemName(menuItemId, LANG_TR, dto.tr, connection);

      // Insert English name
      await this.insertMenuItemName(menuItemId, LANG_EN, dto.en, connection);

      await this.databaseService.commit(connection);

      this.logger.log(`Menu item created successfully: ${dto.reportId}`);

      return {
        id: menuItemId,
        code: String(nextValues.nextItemCode),
        name: dto.tr,
        url: `/report/${dto.reportId}`,
        iconDesktop: 'caret-forward',
        iconMobile: 'caret-forward',
        type: 1,
        priority: nextValues.nextPriority,
      };
    } catch (error) {
      await this.databaseService.rollback(connection);
      this.logger.error(`Failed to create menu item: ${error.message}`);
      throw error;
    }
  }

  async updateMenuItem(
    menuItemId: number,
    dto: UpdateMenuItemDto,
  ): Promise<void> {
    const connection = await this.databaseService.beginTransaction();

    try {
      // Check if menu item exists
      const existingItem = await this.findMenuItemById(menuItemId, connection);
      if (!existingItem) {
        throw new NotFoundException(
          `Menu item with id '${menuItemId}' not found`,
        );
      }

      // Update names if provided
      if (dto.tr) {
        await this.updateMenuItemName(menuItemId, LANG_TR, dto.tr, connection);
      }
      if (dto.en) {
        await this.updateMenuItemName(menuItemId, LANG_EN, dto.en, connection);
      }

      // Update priority if provided
      if (dto.priority !== undefined) {
        await this.updateMenuItemPriority(menuItemId, dto.priority, connection);
      }

      await this.databaseService.commit(connection);

      this.logger.log(`Menu item updated successfully: ${menuItemId}`);
    } catch (error) {
      await this.databaseService.rollback(connection);
      this.logger.error(`Failed to update menu item: ${error.message}`);
      throw error;
    }
  }

  async deleteMenuItem(menuItemId: number): Promise<void> {
    const connection = await this.databaseService.beginTransaction();

    try {
      // Check if menu item exists
      const existingItem = await this.findMenuItemById(menuItemId, connection);
      if (!existingItem) {
        throw new NotFoundException(
          `Menu item with id '${menuItemId}' not found`,
        );
      }

      // Check if menu item has permissions assigned
      const hasPermissions = await this.checkMenuItemHasPermissions(
        menuItemId,
        connection,
      );
      if (hasPermissions) {
        throw new ConflictException(
          `Cannot delete menu item '${menuItemId}': it has permissions assigned. Remove permissions first.`,
        );
      }

      // Delete from qrMenuItemName first (child table)
      await this.deleteMenuItemNames(menuItemId, connection);

      // Delete from qrMenuItem (parent table)
      await this.deleteMenuItemRecord(menuItemId, connection);

      await this.databaseService.commit(connection);

      this.logger.log(`Menu item deleted successfully: ${menuItemId}`);
    } catch (error) {
      await this.databaseService.rollback(connection);
      this.logger.error(`Failed to delete menu item: ${error.message}`);
      throw error;
    }
  }

  async getAllReportMenuItems(): Promise<ReportMenuItem[]> {
    const sql = `
      SELECT  
        mi.menuItemId,
        (SELECT mia.descr FROM qrMenuItemName mia WHERE mia.menuItemId = mi.menuItemId AND mia.contentLanguageId = ?) AS tr,
        (SELECT mia.descr FROM qrMenuItemName mia WHERE mia.menuItemId = mi.menuItemId AND mia.contentLanguageId = ?) AS en,
        mi.itemCode,
        mi.itemUri,
        mi.priority,
        mi.active
      FROM qrMenuItem mi 
      WHERE mi.menuGroupId = ?
      ORDER BY mi.priority
    `;

    return this.databaseService.query<ReportMenuItem>(sql, [
      LANG_TR,
      LANG_EN,
      REPORTS_MENU_GROUP_ID,
    ]);
  }

  async getReportMenuItem(menuItemId: number): Promise<ReportMenuItem> {
    const sql = `
      SELECT  
        mi.menuItemId,
        (SELECT mia.descr FROM qrMenuItemName mia WHERE mia.menuItemId = mi.menuItemId AND mia.contentLanguageId = ?) AS tr,
        (SELECT mia.descr FROM qrMenuItemName mia WHERE mia.menuItemId = mi.menuItemId AND mia.contentLanguageId = ?) AS en,
        mi.itemCode,
        mi.itemUri,
        mi.priority,
        mi.active
      FROM qrMenuItem mi 
      WHERE mi.menuItemId = ?
    `;

    const result = await this.databaseService.queryOne<ReportMenuItem>(sql, [
      LANG_TR,
      LANG_EN,
      menuItemId,
    ]);

    if (!result) {
      throw new NotFoundException(
        `Menu item with id '${menuItemId}' not found`,
      );
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helper methods
  // ─────────────────────────────────────────────────────────────────────────────

  private async fetchMenuItems(
    contentLanguageId: number,
    userProfileId: number,
  ): Promise<MenuItemRow[]> {
    const sql = `
      SELECT 
        mg.iconDesktop AS groupIconDesktop,
        mg.iconMobile AS groupIconMobile,	
        mga.descr AS menuGroupName,
        mia.descr AS menuItemName,	
        mi.menuItemId,
        mi.menuGroupId,
        mi.itemCode,
        mi.itemType,
        mi.itemUri,
        mi.iconDesktop,
        mi.iconMobile,
        mi.priority,
        mi.active
      FROM 
        qrMenuItem mi,
        qrMenuItemName mia,
        qrMenuItemPermission mip,
        qrMenuGroup mg,
        qrMenuGroupName mga
      WHERE
        mi.menuItemId = mia.menuItemId
        AND mip.menuItemId = mi.menuItemId
        AND mi.menuGroupId = mg.menuGroupId
        AND mg.menuGroupId = mga.menuGroupId
        AND mia.ContentLanguageId = mga.ContentLanguageId
        AND mip.permissionType = 1
        AND mga.ContentLanguageId = ?
        AND mip.userProfileId = ?
      ORDER BY
        mi.menuGroupId, mi.priority
    `;

    return this.databaseService.query<MenuItemRow>(sql, [
      contentLanguageId,
      userProfileId,
    ]);
  }

  private transformToMenu(rows: MenuItemRow[]): Menu {
    const groupMap = new Map<number, MenuGroup>();

    for (const row of rows) {
      let group = groupMap.get(row.menuGroupId);

      if (!group) {
        group = {
          id: row.menuGroupId,
          name: row.menuGroupName,
          iconDesktop: row.groupIconDesktop || '',
          iconMobile: row.groupIconMobile || '',
          items: [],
        };
        groupMap.set(row.menuGroupId, group);
      }

      const menuItem: MenuItem = {
        id: row.menuItemId,
        code: row.itemCode || '',
        name: row.menuItemName,
        url: row.itemUri || '',
        iconDesktop: row.iconDesktop || '',
        iconMobile: row.iconMobile || '',
        type: row.itemType,
        priority: row.priority,
      };

      group.items.push(menuItem);
    }

    return {
      groups: Array.from(groupMap.values()),
    };
  }

  private async getNextValues(
    connection: TransactionConnection,
  ): Promise<NextValues> {
    // Get max itemCode from entire table (must be unique across all groups)
    const maxCodeSql = `SELECT COALESCE(MAX(itemCode), 0) AS maxCode FROM qrMenuItem`;
    const maxCodeResult = await this.databaseService.queryOneWithConnection<{
      maxCode: number;
    }>(maxCodeSql, [], connection);

    // Get max priority from reports group only (menuGroupId = 2)
    const maxPrioritySql = `
      SELECT COALESCE(MAX(priority), 0) AS maxPriority 
      FROM qrMenuItem 
      WHERE menuGroupId = ?
    `;
    const maxPriorityResult =
      await this.databaseService.queryOneWithConnection<{ maxPriority: number }>(
        maxPrioritySql,
        [REPORTS_MENU_GROUP_ID],
        connection,
      );

    return {
      nextItemCode: (maxCodeResult?.maxCode ?? 0) + 1,
      nextPriority: (maxPriorityResult?.maxPriority ?? 0) + 1,
    };
  }

  private async findMenuItemByUri(
    itemUri: string,
    connection: TransactionConnection,
  ): Promise<{ menuItemId: number } | null> {
    const sql = `SELECT menuItemId FROM qrMenuItem WHERE itemUri = ?`;
    return this.databaseService.queryOneWithConnection<{ menuItemId: number }>(
      sql,
      [itemUri],
      connection,
    );
  }

  private async findMenuItemById(
    menuItemId: number,
    connection: TransactionConnection,
  ): Promise<{ menuItemId: number } | null> {
    const sql = `SELECT menuItemId FROM qrMenuItem WHERE menuItemId = ?`;
    return this.databaseService.queryOneWithConnection<{ menuItemId: number }>(
      sql,
      [menuItemId],
      connection,
    );
  }

  private async insertMenuItem(
    reportId: string,
    nextValues: NextValues,
    connection: TransactionConnection,
  ): Promise<number> {
    const sql = `
      INSERT INTO qrMenuItem
      (menuGroupId, itemCode, itemType, itemUri, iconDesktop, iconMobile, priority, active)
      VALUES (?, ?, 1, ?, 'caret-forward', 'caret-forward', ?, 1)
    `;

    const result = await this.databaseService.execute(
      sql,
      [
        REPORTS_MENU_GROUP_ID,
        nextValues.nextItemCode,
        `/report/${reportId}`,
        nextValues.nextPriority,
      ],
      connection,
    );

    return result.insertId;
  }

  private async insertMenuItemName(
    menuItemId: number,
    contentLanguageId: number,
    descr: string,
    connection: TransactionConnection,
  ): Promise<void> {
    const sql = `
      INSERT INTO qrMenuItemName (menuItemId, contentLanguageId, descr)
      VALUES (?, ?, ?)
    `;

    await this.databaseService.execute(
      sql,
      [menuItemId, contentLanguageId, descr],
      connection,
    );
  }

  private async updateMenuItemName(
    menuItemId: number,
    contentLanguageId: number,
    descr: string,
    connection: TransactionConnection,
  ): Promise<void> {
    const sql = `
      UPDATE qrMenuItemName 
      SET descr = ? 
      WHERE menuItemId = ? AND contentLanguageId = ?
    `;

    await this.databaseService.execute(
      sql,
      [descr, menuItemId, contentLanguageId],
      connection,
    );
  }

  private async updateMenuItemPriority(
    menuItemId: number,
    priority: number,
    connection: TransactionConnection,
  ): Promise<void> {
    const sql = `UPDATE qrMenuItem SET priority = ? WHERE menuItemId = ?`;

    await this.databaseService.execute(
      sql,
      [priority, menuItemId],
      connection,
    );
  }

  private async checkMenuItemHasPermissions(
    menuItemId: number,
    connection: TransactionConnection,
  ): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) AS permCount 
      FROM qrMenuItemPermission 
      WHERE menuItemId = ?
    `;

    const result = await this.databaseService.queryOneWithConnection<{
      permCount: number;
    }>(sql, [menuItemId], connection);

    return (result?.permCount ?? 0) > 0;
  }

  private async deleteMenuItemNames(
    menuItemId: number,
    connection: TransactionConnection,
  ): Promise<void> {
    const sql = `DELETE FROM qrMenuItemName WHERE menuItemId = ?`;
    await this.databaseService.execute(sql, [menuItemId], connection);
  }

  private async deleteMenuItemRecord(
    menuItemId: number,
    connection: TransactionConnection,
  ): Promise<void> {
    const sql = `DELETE FROM qrMenuItem WHERE menuItemId = ?`;
    await this.databaseService.execute(sql, [menuItemId], connection);
  }
}
