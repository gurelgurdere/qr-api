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
  ) {}
}
