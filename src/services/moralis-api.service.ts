/* eslint-disable @typescript-eslint/no-explicit-any */
import {inject, Provider} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {MoralisApiDataSource} from '../datasources';

export interface MoralisApi {
  // this is where you define the Node.js methods that will be
  // mapped to REST/SOAP/gRPC operations as stated in the datasource
  // json file.
  getCollectionInfo(address: string, chain: string): Promise<any>;

  getCollection(
    address: string,
    chain: string,
    limit: number,
    cursor: string,
  ): Promise<any>;

  getNFTsForContract(
    owner: string,
    collection: string,
    chain: string,
    limit: number,
    cursor: string,
  ): Promise<any>;

  getNFTTokenIdOwners(
    collection: string,
    tokenid: string,
    chain: string,
  ): Promise<any>;

  getNFTsForWallet(
    wallet: string,
    chain: string,
    limit: number,
    cursor: string,
  ): Promise<any>;

  getNFTByTokenId(
    collection: string,
    tokenid: string,
    chain: string,
  ): Promise<any>;
}

export class MoralisApiProvider implements Provider<MoralisApi> {
  constructor(
    // MoralisApi must match the name property in the datasource json file
    @inject('datasources.MoralisApi')
    protected dataSource: MoralisApiDataSource = new MoralisApiDataSource(),
  ) {}

  value(): Promise<MoralisApi> {
    return getService(this.dataSource);
  }
}
