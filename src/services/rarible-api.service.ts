/* eslint-disable @typescript-eslint/no-explicit-any */
import {inject, Provider} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {RaribleApiDataSource} from '../datasources';

export interface RaribleApi {
  // this is where you define the Node.js methods that will be
  // mapped to REST/SOAP/gRPC operations as stated in the datasource
  // json file.
  getCollectionInfo(collection_id: string): Promise<any>;

  getCollection(
    collection_id: string,
    size: number,
    continuation: string,
  ): Promise<any>;

  getByOwner(
    owner_id: string,
    size: number,
    continuation: string,
  ): Promise<any>;

  getOwnersByItemId(itemId: string): Promise<any>;

  getByItemId(itemId: string): Promise<any>;

  getCollectionForOwner(
    owner_id: string,
    collection_id: string,
    chain: string,
    size: number,
    continuation: string,
  ): Promise<any>;
}

export class RaribleApiProvider implements Provider<RaribleApi> {
  constructor(
    // RaribleAPI must match the name property in the datasource json file
    @inject('datasources.RaribleAPI')
    protected dataSource: RaribleApiDataSource = new RaribleApiDataSource(),
  ) {}

  value(): Promise<RaribleApi> {
    return getService(this.dataSource);
  }
}
