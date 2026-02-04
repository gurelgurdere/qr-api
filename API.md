# QR-API - REST API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
All endpoints (except `/auth/login`) require JWT Bearer token authentication.

### Headers
```
Authorization: Bearer <access_token>
Accept-Language: tr-TR | en-US (optional, defaults to tr-TR)
Content-Type: application/json
```

---

## Standard Response Format

All API responses follow this structure:

```json
{
  "status": 200,
  "message": "Success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

---

## 1. Auth Module

### POST /auth/login
Authenticates user and returns JWT token.

**Authentication:** Not required (Public endpoint)

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "firmGroupId": 1,
    "firmGroupName": "Holding A.Ş.",
    "firmGroupNameShort": "HOLD",
    "firmId": 1,
    "firmName": "Şirket A.Ş.",
    "firmNameShort": "ŞRK",
    "departmentId": 1,
    "departmentName": "IT Department",
    "authorityName": "Admin",
    "authorityLevel": 10,
    "positionId": 1,
    "positionName": "Manager",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "imageUri": "/images/user1.jpg",
    "userProfileId": 1,
    "userTypeCode": 2,
    "userVariables": [
      {
        "variableName": "SALES_PERSON_ID",
        "variableValue": "92"
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

---

## 2. Menu Module

### GET /menu
Retrieves menu structure for the authenticated user based on their profile permissions.

**Authentication:** Required

**Headers:**
- `Accept-Language`: `tr-TR` | `en-US` (determines menu item language)

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Menu retrieved successfully",
  "data": {
    "groups": [
      {
        "id": 1,
        "name": "Tanımlar",
        "iconDesktop": "settings",
        "iconMobile": "settings-outline",
        "items": [
          {
            "id": 10,
            "code": "10",
            "name": "Kullanıcı Profili",
            "url": "/user-profile",
            "iconDesktop": "people",
            "iconMobile": "people-outline",
            "type": 1,
            "priority": 1
          }
        ]
      },
      {
        "id": 2,
        "name": "Raporlar",
        "iconDesktop": "document",
        "iconMobile": "document-outline",
        "items": [
          {
            "id": 20,
            "code": "20",
            "name": "Satış Raporu",
            "url": "/report/sales-report",
            "iconDesktop": "caret-forward",
            "iconMobile": "caret-forward",
            "type": 1,
            "priority": 1
          }
        ]
      }
    ]
  }
}
```

---

### POST /menu/item
Creates a new report menu item.

**Authentication:** Required

**Request Body:**
```json
{
  "reportId": "sales-report",
  "tr": "Satış Raporu",
  "en": "Sales Report"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reportId | string | Yes | Report identifier (becomes `/report/{reportId}` URL) |
| tr | string | Yes | Turkish menu item name |
| en | string | Yes | English menu item name |

**Response (201 Created):**
```json
{
  "status": 201,
  "message": "Menu item created successfully",
  "data": {
    "id": 25,
    "code": "25",
    "name": "Satış Raporu",
    "url": "/report/sales-report",
    "iconDesktop": "caret-forward",
    "iconMobile": "caret-forward",
    "type": 1,
    "priority": 5
  }
}
```

**Error Responses:**
- `409 Conflict` - Report URI already exists in menu

---

### PUT /menu/item/:id
Updates an existing menu item.

**Authentication:** Required

**Path Parameters:**
- `id` (number): Menu item ID

**Request Body:**
```json
{
  "tr": "Güncel Satış Raporu",
  "en": "Updated Sales Report",
  "priority": 2
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tr | string | No | Turkish menu item name |
| en | string | No | English menu item name |
| priority | number | No | Display order within the group |

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Menu item updated successfully"
}
```

**Error Responses:**
- `404 Not Found` - Menu item not found

---

### DELETE /menu/item/:id
Deletes a menu item.

**Authentication:** Required

**Path Parameters:**
- `id` (number): Menu item ID

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Menu item deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Menu item not found
- `409 Conflict` - Menu item has permission assignments

---

### GET /menu/item
Retrieves all report menu items (items in Reports menu group).

**Authentication:** Required

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Report menu items retrieved successfully",
  "data": [
    {
      "menuItemId": 20,
      "tr": "Satış Raporu",
      "en": "Sales Report",
      "itemCode": "20",
      "itemUri": "/report/sales-report",
      "priority": 1,
      "active": 1
    },
    {
      "menuItemId": 21,
      "tr": "Stok Raporu",
      "en": "Stock Report",
      "itemCode": "21",
      "itemUri": "/report/stock-report",
      "priority": 2,
      "active": 1
    }
  ]
}
```

---

### GET /menu/item/:id
Retrieves a specific report menu item by ID.

**Authentication:** Required

**Path Parameters:**
- `id` (number): Menu item ID

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Report menu item retrieved successfully",
  "data": {
    "menuItemId": 20,
    "tr": "Satış Raporu",
    "en": "Sales Report",
    "itemCode": "20",
    "itemUri": "/report/sales-report",
    "priority": 1,
    "active": 1
  }
}
```

**Error Responses:**
- `404 Not Found` - Menu item not found

---

## 3. User Profile Module

### GET /user-profile
Retrieves all user profiles for the current firm.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "User profiles retrieved successfully",
  "data": [
    {
      "id": 1,
      "descr": "Administrator"
    },
    {
      "id": 2,
      "descr": "Sales Manager"
    }
  ]
}
```

---

### GET /user-profile/:id
Retrieves a specific user profile.

**Authentication:** Required

**Path Parameters:**
- `id` (number): User profile ID

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "User profile retrieved successfully",
  "data": {
    "id": 1,
    "descr": "Administrator"
  }
}
```

**Error Responses:**
- `404 Not Found` - User profile not found

---

### POST /user-profile
Creates a new user profile.

**Authentication:** Required

**Request Body:**
```json
{
  "descr": "New Profile"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| descr | string | Yes | Profile name/description |

**Response (201 Created):**
```json
{
  "status": 201,
  "message": "User profile created successfully",
  "data": {
    "id": 3,
    "descr": "New Profile"
  }
}
```

---

### PUT /user-profile/:id
Updates an existing user profile.

**Authentication:** Required

**Path Parameters:**
- `id` (number): User profile ID

**Request Body:**
```json
{
  "descr": "Updated Profile Name"
}
```

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "User profile updated successfully"
}
```

**Error Responses:**
- `404 Not Found` - User profile not found

---

### DELETE /user-profile/:id
Deletes a user profile.

**Authentication:** Required

**Path Parameters:**
- `id` (number): User profile ID

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "User profile deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - User profile not found
- `409 Conflict` - Profile is assigned to users (has references in qrFirmUser)

---

## 4. Variable Module

### GET /variable
Retrieves all user variables for the current firm.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Variables retrieved successfully",
  "data": [
    {
      "variableId": 1,
      "variableName": "SALES_PERSON_ID"
    },
    {
      "variableId": 2,
      "variableName": "AUTH"
    }
  ]
}
```

---

### GET /variable/:id
Retrieves a specific variable.

**Authentication:** Required

**Path Parameters:**
- `id` (number): Variable ID

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Variable retrieved successfully",
  "data": {
    "variableId": 1,
    "variableName": "SALES_PERSON_ID"
  }
}
```

**Error Responses:**
- `404 Not Found` - Variable not found

---

### POST /variable
Creates a new variable.

**Authentication:** Required

**Request Body:**
```json
{
  "variableName": "REGION_CODE"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| variableName | string | Yes | Variable name (must be unique within firm) |

**Response (201 Created):**
```json
{
  "status": 201,
  "message": "Variable created successfully",
  "data": {
    "variableId": 3,
    "variableName": "REGION_CODE"
  }
}
```

**Error Responses:**
- `409 Conflict` - Variable name already exists

---

### PUT /variable/:id
Updates an existing variable.

**Authentication:** Required

**Path Parameters:**
- `id` (number): Variable ID

**Request Body:**
```json
{
  "variableName": "UPDATED_VARIABLE_NAME"
}
```

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Variable updated successfully"
}
```

**Error Responses:**
- `404 Not Found` - Variable not found
- `409 Conflict` - Variable name already exists

---

### DELETE /variable/:id
Deletes a variable.

**Authentication:** Required

**Path Parameters:**
- `id` (number): Variable ID

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Variable deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Variable not found
- `409 Conflict` - Variable has values assigned to users (has references in qrUserVariableValue)

---

## 5. Report Permission Module

### GET /report-permission/:userProfileId
Retrieves all report menu items with their permission status for a specific user profile.

**Authentication:** Required

**Path Parameters:**
- `userProfileId` (number): User profile ID

**Headers:**
- `Accept-Language`: `tr-TR` | `en-US` (determines menu item name language)

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Report permissions retrieved successfully",
  "data": [
    {
      "menuItemId": 20,
      "menuItemName": "Satış Raporu",
      "permissionType": 1
    },
    {
      "menuItemId": 21,
      "menuItemName": "Stok Raporu",
      "permissionType": 0
    },
    {
      "menuItemId": 22,
      "menuItemName": "Finans Raporu",
      "permissionType": 1
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| menuItemId | number | Menu item ID |
| menuItemName | string | Menu item name (based on Accept-Language header) |
| permissionType | number | Permission status: 0 = no permission, 1 = has permission |

---

### POST /report-permission
Saves report permissions for a user profile. Replaces all existing report permissions.

**Authentication:** Required

**Request Body:**
```json
{
  "userProfileId": 4,
  "menuItemIds": [20, 22, 25]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userProfileId | number | Yes | User profile ID |
| menuItemIds | number[] | Yes | Array of menu item IDs to grant permission (empty array removes all permissions) |

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Report permissions saved successfully"
}
```

**Notes:**
- This endpoint replaces all existing report permissions for the specified user profile
- Only report menu items (menuGroupId = 2) are affected
- Permissions for system menu items are not modified

---

## 6. User Module

### GET /user
Retrieves all users for the current firm.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Users retrieved successfully",
  "data": [
    {
      "userId": 1,
      "firmGroupId": 1,
      "firmGroupName": "Holding A.Ş.",
      "firmGroupNameShort": "HOLD",
      "firmId": 1,
      "firmName": "Şirket A.Ş.",
      "firmNameShort": "ŞRK",
      "departmentId": 1,
      "departmentName": "IT",
      "authorityName": "Admin",
      "authorityLevel": 10,
      "positionId": 1,
      "positionName": "Manager",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "password": "****",
      "email": "john@example.com",
      "imageUri": "/images/user1.jpg",
      "userProfileId": 1,
      "userTypeCode": 2,
      "active": 1
    }
  ]
}
```

---

### GET /user/:id
Retrieves a specific user with their variable values.

**Authentication:** Required

**Path Parameters:**
- `id` (number): User ID

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "User retrieved successfully",
  "data": {
    "userId": 1,
    "firmGroupId": 1,
    "firmGroupName": "Holding A.Ş.",
    "firmGroupNameShort": "HOLD",
    "firmId": 1,
    "firmName": "Şirket A.Ş.",
    "firmNameShort": "ŞRK",
    "departmentId": 1,
    "departmentName": "IT",
    "authorityName": "Admin",
    "authorityLevel": 10,
    "positionId": 1,
    "positionName": "Manager",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "password": "****",
    "email": "john@example.com",
    "imageUri": "/images/user1.jpg",
    "userProfileId": 1,
    "userTypeCode": 2,
    "active": 1,
    "userVariables": [
      {
        "variableId": 1,
        "variableName": "SALES_PERSON_ID",
        "variableValue": "92"
      },
      {
        "variableId": 2,
        "variableName": "AUTH",
        "variableValue": "8"
      }
    ]
  }
}
```

**Error Responses:**
- `404 Not Found` - User not found

---

### POST /user
Creates a new user.

**Authentication:** Required

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "secret123",
  "departmentId": 1,
  "userProfileId": 2,
  "userPositionId": 1,
  "userTypeId": 4,
  "active": 1,
  "userVariables": [
    {
      "variableId": 1,
      "variableValue": "93"
    },
    {
      "variableId": 2,
      "variableValue": "5"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firstName | string | Yes | User's first name |
| lastName | string | Yes | User's last name |
| email | string | Yes | User's email (must be unique) |
| password | string | Yes | User's password |
| departmentId | number | Yes | Department ID |
| userProfileId | number | Yes | User profile ID (for menu permissions) |
| userPositionId | number | Yes | User position ID |
| userTypeId | number | Yes | User type ID (1=PlatformAdmin, 2=FirmAdmin, 3=FirmExecutive, 4=FirmUser) |
| active | number | Yes | Active status (0=inactive, 1=active) |
| userVariables | array | No | Array of variable assignments |
| userVariables[].variableId | number | Yes | Variable ID |
| userVariables[].variableValue | string | Yes | Variable value |

**Response (201 Created):**
```json
{
  "status": 201,
  "message": "User created successfully",
  "data": {
    "userId": 5
  }
}
```

**Error Responses:**
- `409 Conflict` - Email already exists

---

### PUT /user/:id
Updates an existing user.

**Authentication:** Required

**Path Parameters:**
- `id` (number): User ID

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith Updated",
  "email": "jane.new@example.com",
  "password": "newpassword",
  "departmentId": 1,
  "userProfileId": 2,
  "userPositionId": 1,
  "userTypeId": 4,
  "active": 1,
  "userVariables": [
    {
      "variableId": 1,
      "variableValue": "94"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "User updated successfully"
}
```

**Error Responses:**
- `404 Not Found` - User not found
- `409 Conflict` - Email already exists (used by another user)

---

### DELETE /user/:id
Deletes a user.

**Authentication:** Required

**Path Parameters:**
- `id` (number): User ID

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "User deleted successfully"
}
```

---

## 7. Report Module

### POST /report/load
Loads a report definition and prepares parameters for user input.

**Authentication:** Required

**Request Body:**
```json
{
  "reportId": "sales-report"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reportId | string | Yes | Report identifier (filename without .qr.json extension) |

**Response - Parameters Required (200 OK):**
```json
{
  "status": 200,
  "message": "Report definition loaded. Parameters required.",
  "data": {
    "reportId": "sales-report",
    "title": "Satış Raporu (İki tarih arası)",
    "description": "İki tarih arasındaki satışların raporu",
    "requiresParameters": true,
    "parameters": [
      {
        "id": "CUSTOMER_ID",
        "type": "list",
        "description": "Müşteri Seçimi",
        "key": "CUSTOMER_ID",
        "display": "CUSTOMER_NAME",
        "data": [
          {
            "CUSTOMER_ID": 132,
            "CUSTOMER_NAME": "AKÜNLER LTD."
          },
          {
            "CUSTOMER_ID": 180,
            "CUSTOMER_NAME": "ASLAR PRES DÖK.SAN.TİC.A.Ş."
          }
        ]
      },
      {
        "id": "BEGIN_DATE",
        "type": "date",
        "description": "Başlangıç Tarihi"
      },
      {
        "id": "END_DATE",
        "type": "date",
        "description": "Bitiş Tarihi"
      }
    ]
  }
}
```

**Response - No Parameters Needed (200 OK):**
```json
{
  "status": 200,
  "message": "Report definition loaded. Ready to execute.",
  "data": {
    "reportId": "simple-report",
    "title": "Basit Rapor",
    "description": "Parametre gerektirmeyen rapor",
    "requiresParameters": false
  }
}
```

**Error Responses:**
- `404 Not Found` - Report definition file not found
- `400 Bad Request` - Invalid report format or data source not configured

---

### POST /report/execute
Executes a report with provided parameters.

**Authentication:** Required

**Request Body:**
```json
{
  "reportId": "sales-report",
  "parameters": {
    "CUSTOMER_ID": 132,
    "BEGIN_DATE": "2024-01-01",
    "END_DATE": "2024-12-31"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reportId | string | Yes | Report identifier |
| parameters | object | No | Key-value pairs of parameter values (required if report has non-userVariable parameters) |

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Report executed successfully",
  "data": {
    "reportId": "sales-report",
    "title": "Satış Raporu (İki tarih arası)",
    "description": "İki tarih arasındaki satışların raporu",
    "columns": [
      {
        "name": "INVOICE_DATE",
        "header": "Fatura Tarihi",
        "type": "date",
        "alignment": "center"
      },
      {
        "name": "INVOICE_NUMBER",
        "header": "Fatura Numarası",
        "type": "string",
        "alignment": "left"
      },
      {
        "name": "CUSTOMER_NAME",
        "header": "Müşteri Unvanı",
        "type": "string",
        "alignment": "left"
      },
      {
        "name": "PRODUCT_NAME",
        "header": "Ürün Adı",
        "type": "string",
        "alignment": "left"
      },
      {
        "name": "AMOUNT_KG",
        "header": "Miktar (Kg)",
        "type": "number",
        "alignment": "right",
        "decimalPlaces": 0,
        "aggrFuncInSum": "sum"
      },
      {
        "name": "AMOUNT_TL",
        "header": "Tutar (TL)",
        "type": "number",
        "alignment": "right",
        "decimalPlaces": 0,
        "aggrFuncInSum": "sum"
      },
      {
        "name": "UNIT_PRICE_TL",
        "header": "Birim Fiyat (TL)",
        "type": "number",
        "alignment": "right",
        "decimalPlaces": 2,
        "aggrFuncInSum": "func"
      }
    ],
    "data": [
      {
        "INVOICE_DATE": "2024-01-03T00:00:00.000Z",
        "INVOICE_NUMBER": "BLG2024000000001",
        "CUSTOMER_NAME": "BOSCH SANAYİ VE TİCARET A.Ş.",
        "PRODUCT_NAME": "CUTTEX HFB-11",
        "AMOUNT_KG": 4800,
        "AMOUNT_TL": 65756.88,
        "UNIT_PRICE_TL": 13.70
      },
      {
        "INVOICE_DATE": "2024-01-04T00:00:00.000Z",
        "INVOICE_NUMBER": "BLG2024000000002",
        "CUSTOMER_NAME": "SAB OTOMOTİV A.Ş.",
        "PRODUCT_NAME": "GENERAX UY",
        "AMOUNT_KG": 200,
        "AMOUNT_TL": 3470.5,
        "UNIT_PRICE_TL": 17.35
      }
    ]
  }
}
```

**Column Properties:**

| Property | Type | Description |
|----------|------|-------------|
| name | string | Column identifier (matches data field) |
| header | string | Display header text |
| type | string | Data type: `date`, `string`, `number` |
| alignment | string | Text alignment: `left`, `center`, `right` |
| decimalPlaces | number | (Optional) Decimal places for number type |
| aggrFuncInSum | string | (Optional) Aggregation function: `sum`, `avg`, `min`, `max`, `func`, `` |

**Notes:**
- Columns with `visibility` rules are automatically filtered based on user variables
- Custom calculated columns (with `function` definitions) are computed server-side
- The `data` array only contains visible columns

**Error Responses:**
- `404 Not Found` - Report definition not found
- `400 Bad Request` - Missing required parameters or invalid data source

---

## TypeScript Interfaces

For frontend development, here are the TypeScript interfaces:

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// Common Response
// ─────────────────────────────────────────────────────────────────────────────

interface ApiResponse<T = void> {
  status: number;
  message: string;
  data?: T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

interface LoginRequest {
  username: string;
  password: string;
}

interface UserVariable {
  variableName: string;
  variableValue: string;
}

interface AuthUser {
  userId: number;
  firmGroupId: number;
  firmGroupName: string;
  firmGroupNameShort: string;
  firmId: number;
  firmName: string;
  firmNameShort: string;
  departmentId: number;
  departmentName: string;
  authorityName: string;
  authorityLevel: number;
  positionId: number;
  positionName: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  imageUri: string;
  userProfileId: number;
  userTypeCode: number;
  userVariables: UserVariable[];
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

// ─────────────────────────────────────────────────────────────────────────────
// Menu
// ─────────────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: number;
  code: string;
  name: string;
  url: string;
  iconDesktop: string;
  iconMobile: string;
  type: number;
  priority: number;
}

interface MenuGroup {
  id: number;
  name: string;
  iconDesktop: string;
  iconMobile: string;
  items: MenuItem[];
}

interface Menu {
  groups: MenuGroup[];
}

interface CreateMenuItemRequest {
  reportId: string;
  tr: string;
  en: string;
}

interface UpdateMenuItemRequest {
  tr?: string;
  en?: string;
  priority?: number;
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

// ─────────────────────────────────────────────────────────────────────────────
// User Profile
// ─────────────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: number;
  descr: string;
}

interface UserProfileRequest {
  descr: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Variable
// ─────────────────────────────────────────────────────────────────────────────

interface Variable {
  variableId: number;
  variableName: string;
  variableValue?: string;
}

interface VariableRequest {
  variableName: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Report Permission
// ─────────────────────────────────────────────────────────────────────────────

interface ReportPermission {
  menuItemId: number;
  menuItemName: string;
  permissionType: number; // 0 = no permission, 1 = has permission
}

interface ReportPermissionRequest {
  userProfileId: number;
  menuItemIds: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────────────────────

interface UserVariableValue {
  variableId: number;
  variableValue: string;
}

interface UserRequest {
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  departmentId: number;
  userProfileId: number;
  userPositionId: number;
  userTypeId: number;
  active: number;
  userVariables?: UserVariableValue[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────────────────────────────

interface ReportLoadRequest {
  reportId: string;
}

interface ReportParameter {
  id: string;
  type: 'list' | 'date' | 'number' | 'string';
  description?: string;
  key?: string;
  display?: string;
  data?: Array<Record<string, unknown>>;
}

interface ReportLoadResponse {
  reportId: string;
  title: string;
  description: string;
  requiresParameters: boolean;
  parameters?: ReportParameter[];
}

interface ReportExecuteRequest {
  reportId: string;
  parameters?: Record<string, unknown>;
}

interface ReportColumn {
  name: string;
  header: string;
  type: 'date' | 'string' | 'number';
  alignment: 'left' | 'center' | 'right';
  decimalPlaces?: number;
  aggrFuncInSum?: 'sum' | 'avg' | 'min' | 'max' | 'func' | '';
}

interface ReportExecuteResponse {
  reportId: string;
  title: string;
  description: string;
  columns: ReportColumn[];
  data: Array<Record<string, unknown>>;
}
```

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input or missing parameters |
| 401 | Unauthorized - Invalid or missing JWT token |
| 404 | Not Found - Resource does not exist |
| 409 | Conflict - Resource already exists or has dependencies |
| 500 | Internal Server Error |
