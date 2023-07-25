import {Model, model, property} from '@loopback/repository';
import {Collection} from './collection.model';

@model()
export class CollectionResponse extends Model {
  @property({
    type: 'boolean',
  })
  success?: boolean;

  @property({
    type: 'array',
    itemType: 'object',
  })
  collections?: Collection[];

  constructor(data?: Partial<CollectionResponse>) {
    super(data);
  }
}

export interface CollectionResponseRelations {
  // describe navigational properties here
}

export type CollectionResponseWithRelations = CollectionResponse &
  CollectionResponseRelations;
