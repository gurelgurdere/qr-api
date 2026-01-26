export interface UserVariable {
  variableName: string;
  variableValue: string;
}

export class AuthUser {
  constructor(
    public userId: number,
    public firmGroupId: number,
    public firmGroupName: string,
    public firmGroupNameShort: string,
    public firmId: number,
    public firmName: string,
    public firmNameShort: string,
    public departmentId: number,
    public departmentName: string,
    public authorityName: string,
    public authorityLevel: number,
    public positionId: number,
    public positionName: string,
    public firstName: string,
    public lastName: string,
    public username: string,
    public email: string,
    public imageUri: string,
    public userProfileId: number,
    public userTypeCode: number,
    public userVariables: UserVariable[] = [],
  ) {}
}

/**
 * Get user variable value by variable name
 * This is a standalone function because JWT payload comes as plain object, not class instance
 */
export function getUserVariableValue(
  authUser: AuthUser,
  variableName: string,
): string | undefined {
  const variable = authUser.userVariables?.find(
    (v) => v.variableName === variableName,
  );
  return variable?.variableValue;
}
