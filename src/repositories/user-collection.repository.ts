import {inject} from '@loopback/core';
import {DefaultKeyValueRepository} from '@loopback/repository';
import {RedisDataSource} from '../datasources';
import {UserCollection} from '../models';

export class UserCollectionRepository extends DefaultKeyValueRepository<UserCollection> {
  constructor(@inject('datasources.redis') dataSource: RedisDataSource) {
    super(UserCollection, dataSource);
  }
}
