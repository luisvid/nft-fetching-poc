/* eslint-disable @typescript-eslint/no-explicit-any */
import {inject, Provider} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {SolanaApiDataSource} from '../datasources';

export interface SolanaApi {
  // this is where you define the Node.js methods that will be
  // mapped to REST/SOAP/gRPC operations as stated in the datasource
  // json file.
  getCollectionInfo(symbol: string): Promise<any>;
  getCollection(symbol: string, offset: number, limit: number): Promise<any>;
  getWalletTokens(address: string, offset: number, limit: number): Promise<any>;
  getTokenByMintAddress(mintAddress: string): Promise<any>;
}

export class SolanaApiProvider implements Provider<SolanaApi> {
  constructor(
    // Solana_API must match the name property in the datasource json file
    @inject('datasources.Solana_API')
    protected dataSource: SolanaApiDataSource = new SolanaApiDataSource(),
  ) {}

  value(): Promise<SolanaApi> {
    return getService(this.dataSource);
  }
}
