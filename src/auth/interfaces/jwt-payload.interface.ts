import { Role } from '../decorators/roles.decorators';

export interface JwtPayload {
  userId: number;
  roles: Role[];
}
