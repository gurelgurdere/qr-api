export interface UserVariableDto {
  variableId: number;
  variableValue: string;
}

export class UserDto {
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
  userVariables?: UserVariableDto[];
}
