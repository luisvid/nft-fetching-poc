import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {ExternalnftDataSource} from '../datasources';
import {Collection, CollectionRelations} from '../models';

export class CollectionRepository extends DefaultCrudRepository<
  Collection,
  typeof Collection.prototype.id,
  CollectionRelations
> {
  constructor(
    @inject('datasources.externalnft') dataSource: ExternalnftDataSource,
  ) {
    super(Collection, dataSource);
  }
}
