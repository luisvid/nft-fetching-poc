import {Entity, model, property} from '@loopback/repository';

@model()
export class UserOwnership extends Entity {
  @property({
    type: 'string',
  })
  collectionId?: string;

  @property({
    type: 'string',
  })
  tokenId?: string;

  @property({
    type: 'string',
  })
  image?: string | null;

  @property({
    type: 'array',
    itemType: 'string',
  })
  owners: string[];

  constructor(data?: Partial<UserOwnership>) {
    super(data);
  }
}

export interface UserOwnershipRelations {
  // describe navigational properties here
}

export type UserOwnershipWithRelations = UserOwnership & UserOwnershipRelations;
