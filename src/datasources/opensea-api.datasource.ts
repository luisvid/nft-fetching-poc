import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

require('dotenv').config();

// REST connector configuration to query EVM compatible networks
// through OpenSea API
const config = {
  name: 'OPENSEA_API',
  connector: 'rest',
  baseURL: 'https://api.opensea.io/api',
  crud: false,
  options: {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'X-API-Key': `${process.env.OPENSEAAPIKEY}`,
    },
  },
  operations: [
    {
      template: {
        method: 'GET',
        url: 'https://api.opensea.io/api/v1/collection/{collection_slug}',
      },
      functions: {
        getCollectionInfo: ['collection_slug'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://api.opensea.io/api/v1/assets?collection_slug={collection_slug}&limit={limit}&cursor={cursor}',
      },
      functions: {
        getCollection: ['collection_slug', 'limit', 'cursor'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://api.opensea.io/api/v1/assets?collection_slug={collection_slug}&owner={owner}&limit={limit}&cursor={cursor}',
      },
      functions: {
        getCollectionForOwner: ['collection_slug', 'owner', 'limit', 'cursor'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://api.opensea.io/api/v1/assets?owner={owner}&limit={limit}&cursor={cursor}',
      },
      functions: {
        getAssetsForOwner: ['owner', 'limit', 'cursor'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://api.opensea.io/api/v1/asset/{collection_address}/{token_id}',
      },
      functions: {
        getAssetsByItemId: ['collection_address', 'token_id'],
      },
    },
  ],
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class OpenseaApiDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'OPENSEA_API';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.OPENSEA_API', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
