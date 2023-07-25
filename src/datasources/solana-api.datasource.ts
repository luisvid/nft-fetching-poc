import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

// REST connector configuration to query Solana through MagicEden API

const config = {
  name: 'Solana_API',
  connector: 'rest',
  baseURL: 'https://api-mainnet.magiceden.dev',
  crud: false,
  options: {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'ME-Pub-API-Metadata': {paging: true},
    },
  },
  operations: [
    {
      template: {
        method: 'GET',
        url: 'https://api-mainnet.magiceden.dev/v2/collections/{symbol}',
      },
      functions: {
        getCollectionInfo: ['symbol'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://api-mainnet.magiceden.dev/v2/collections/{symbol}/listings?offset={offset}&limit={limit}',
      },
      functions: {
        getCollection: ['symbol', 'offset', 'limit'],
      },
    },
    {
      template: {
        method: 'GET',
        fullResponse: true,
        url: 'https://api-mainnet.magiceden.dev/v2/wallets/{address}/tokens?offset={offset}&limit={limit}',
      },
      functions: {
        getWalletTokens: ['address', 'offset', 'limit'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://api-mainnet.magiceden.dev/v2/tokens/{mintAddress}',
      },
      functions: {
        getTokenByMintAddress: ['mintAddress'],
      },
    },
  ],
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class SolanaApiDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'Solana_API';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.Solana_API', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
