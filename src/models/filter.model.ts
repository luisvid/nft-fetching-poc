import {Model, model, property} from '@loopback/repository';

@model()
export class Filter extends Model {
  @property({
    type: 'string',
  })
  userId?: string;

  @property({
    type: 'number',
  })
  limit?: number;

  @property({
    type: 'string',
  })
  offset?: string;

  @property({
    type: 'boolean',
  })
  useCache?: boolean;

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
  })
  owner: string[];

  @property({
    type: 'array',
    itemType: 'string',
  })
  itemId?: string[];

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
  })
  collection: string[];

  constructor(data?: Partial<Filter>) {
    super(data);
  }
}

export interface FilterRelations {
  // describe navigational properties here
}

export type FilterWithRelations = Filter & FilterRelations;
