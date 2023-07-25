import {Model, model, property} from '@loopback/repository';
import {UserCollection} from './user-collection.model';

@model()
export class UserResponse extends Model {
  @property({
    type: 'string',
  })
  userId?: string;

  @property({
    type: 'boolean',
  })
  nftAccess?: boolean;

  @property({
    type: 'array',
    itemType: 'any',
  })
  data?: UserCollection[];

  constructor(data?: Partial<UserResponse>) {
    super(data);
  }
}

export interface UserResponseRelations {
  // describe navigational properties here
}

export type UserResponseWithRelations = UserResponse & UserResponseRelations;
