import {inject} from '@loopback/core';
import {DefaultKeyValueRepository} from '@loopback/repository';
import {RedisDataSource} from '../datasources';
import {UserResponse} from '../models';

export class UserResponseRepository extends DefaultKeyValueRepository<UserResponse> {
  constructor(@inject('datasources.redis') dataSource: RedisDataSource) {
    super(UserResponse, dataSource);
  }
}
