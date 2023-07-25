import {Entity, model, property} from '@loopback/repository';

@model()
export class Collection extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
  })
  id?: string;

  @property({
    type: 'string',
  })
  address?: string | null;

  @property({
    type: 'string',
  })
  network?: string;

  @property({
    type: 'string',
  })
  market?: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'string',
  })
  image?: string | null;

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'string',
  })
  twitter?: string;

  @property({
    type: 'string',
  })
  discord?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
  })
  stakedNftsEndpoint?: string;

  @property({
    type: 'object',
  })
  stakedData?: object;

  @property({
    type: 'date',
    jsonSchema: {
      format: 'date',
    },
  })
  stakedTimestamp?: string;

  constructor(data?: Partial<Collection>) {
    super(data);
  }
}

export interface CollectionRelations {
  // describe navigational properties here
}

export type CollectionWithRelations = Collection & CollectionRelations;
