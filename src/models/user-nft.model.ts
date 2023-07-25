import {Model, model, property} from '@loopback/repository';

@model()
export class UserNft extends Model {
  @property({
    type: 'string',
  })
  tokenId?: string;

  @property({
    type: 'string',
  })
  solMintAddress?: string;

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'string',
  })
  image?: string | null;

  @property({
    type: 'array',
    itemType: 'string',
  })
  attributes?: Object[];

  constructor(data?: Partial<UserNft>) {
    super(data);
  }
}

export interface UserNftRelations {
  // describe navigational properties here
}

export type UserNftWithRelations = UserNft & UserNftRelations;
