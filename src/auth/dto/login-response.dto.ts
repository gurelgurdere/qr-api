import { AuthUser } from '../auth.model';

export class LoginResponseDto {
  accessToken: string;
  user: AuthUser;
}
