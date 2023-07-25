import {Model, model, property} from '@loopback/repository';

@model()
export class SearchFilter extends Model {
  @property({
    type: 'string',
  })
  network?: string;

  @property({
    type: 'string',
  })
  wallet?: string;

  @property({
    type: 'array',
    itemType: 'string',
  })
  collectionA?: string[];

  @property({
    type: 'array',
    itemType: 'string',
  })
  collectionS?: string[];

  constructor(data?: Partial<SearchFilter>) {
    super(data);
  }
}

export interface SearchFilterRelations {
  // describe navigational properties here
}

export type SearchFilterWithRelations = SearchFilter & SearchFilterRelations;
