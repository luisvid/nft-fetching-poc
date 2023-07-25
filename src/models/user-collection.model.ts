import {Model, model, property} from '@loopback/repository';
import {UserNft} from './user-nft.model';

@model()
export class UserCollection extends Model {
  @property({
    type: 'string',
  })
  id?: string;

  @property({
    type: 'string',
  })
  collectionName?: string;

  @property({
    type: 'string',
  })
  collectionId?: string;

  @property({
    type: 'array',
    itemType: 'any',
  })
  userNfts?: UserNft[];

  constructor(data?: Partial<UserCollection>) {
    super(data);
  }
}

export interface UserCollectionRelations {
  // describe navigational properties here
}

export type UserCollectionWithRelations = UserCollection &
  UserCollectionRelations;
