export interface Menu {
  groups: MenuGroup[];
}

export interface MenuGroup {
  id: number;
  name: string;
  iconDesktop: string;
  iconMobile: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: number;
  code: string;
  name: string;
  url: string;
  iconDesktop: string;
  iconMobile: string;
  type: number;
  priority: number;
}

// Raw row returned from the database query
export interface MenuItemRow {
  groupIconDesktop: string;
  groupIconMobile: string;
  menuGroupName: string;
  menuItemName: string;
  menuItemId: number;
  menuGroupId: number;
  itemCode: string;
  itemType: number;
  itemUri: string;
  iconDesktop: string;
  iconMobile: string;
  priority: number;
  active: number;
}