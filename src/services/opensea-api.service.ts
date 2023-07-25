/* eslint-disable @typescript-eslint/no-explicit-any */
import {inject, Provider} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {OpenseaApiDataSource} from '../datasources/opensea-api.datasource';

export interface OpenseaApi {
  // this is where you define the Node.js methods that will be
  // mapped to REST/SOAP/gRPC operations as stated in the datasource
  // json file.

  getCollectionInfo(collection_slug: string): Promise<any>;

  getCollection(
    collection_slug: string,
    limit: number,
    cursor: string,
  ): Promise<any>;

  getCollectionForOwner(
    collection_slug: string,
    owner: string,
    limit: number,
    cursor: string,
  ): Promise<any>;

  getAssetsForOwner(owner: string, limit: number, cursor: string): Promise<any>;

  getAssetsByItemId(collection_address: string, token_id: string): Promise<any>;
}

export class OpenseaApiProvider implements Provider<OpenseaApi> {
  constructor(
    // OPENSEA_API must match the name property in the datasource json file
    @inject('datasources.OPENSEA_API')
    protected dataSource: OpenseaApiDataSource = new OpenseaApiDataSource(),
  ) {}

  value(): Promise<OpenseaApi> {
    return getService(this.dataSource);
  }
}
