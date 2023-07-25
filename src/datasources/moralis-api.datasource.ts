import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'MoralisApi',
  connector: 'rest',
  baseURL: 'https://deep-index.moralis.io/api',
  crud: false,
  options: {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'X-API-Key': `${process.env.MORALISAPIKEY}`,
    },
  },
  operations: [
    {
      template: {
        method: 'GET',
        url: 'https://deep-index.moralis.io/api/v2/nft/{address}/metadata?chain={chain}',
      },
      functions: {
        getCollectionInfo: ['address', 'chain'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://deep-index.moralis.io/api/v2/nft/{address}?chain={chain}&limit={limit}&cursor={cursor}',
      },
      functions: {
        getCollection: ['address', 'chain', 'limit', 'cursor'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://deep-index.moralis.io/api/v2/{owner}/nft/{collection}?chain={chain}&limit={limit}&cursor={cursor}',
      },
      functions: {
        getNFTsForContract: ['owner', 'collection', 'chain', 'limit', 'cursor'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://deep-index.moralis.io/api/v2/nft/{collection}/{tokenid}/owners?chain={chain}&format=decimal',
      },
      functions: {
        getNFTTokenIdOwners: ['collection', 'tokenid', 'chain'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://deep-index.moralis.io/api/v2/{wallet}/nft?chain={chain}&limit={limit}&cursor={cursor}',
      },
      functions: {
        getNFTsForWallet: ['wallet', 'chain', 'limit', 'cursor'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://deep-index.moralis.io/api/v2/nft/{collection}/{tokenid}?chain={chain}&format=decimal',
      },
      functions: {
        getNFTByTokenId: ['collection', 'tokenid', 'chain'],
      },
    },
  ],
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class MoralisApiDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'MoralisApi';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.MoralisApi', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
