import { Variable } from "src/variable/variable.model";

export interface User {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userTypeCode: UserType;
    active: number;
    userVariables?: Variable[];
}

export enum UserType {
    PlatformAdmin = 1,
    FirmAdmin = 2,
    FirmExecutive = 3,
    FirmUser = 4,
}



