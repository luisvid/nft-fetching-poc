import {Model, model, property} from '@loopback/repository';

@model()
export class CollectionFilter extends Model {
  @property({
    type: 'array',
    itemType: 'string',
    required: true,
  })
  collectionIds: string[];

  constructor(data?: Partial<CollectionFilter>) {
    super(data);
  }
}

export interface CollectionFilterRelations {
  // describe navigational properties here
}

export type CollectionFilterWithRelations = CollectionFilter &
  CollectionFilterRelations;
