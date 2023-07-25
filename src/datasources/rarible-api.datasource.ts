import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

// REST connector configuration to query IMMUTABLEX
// through Rarible API

const config = {
  name: 'RaribleAPI',
  connector: 'rest',
  baseURL: 'https://api.rarible.org',
  crud: false,
  options: {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  },
  operations: [
    {
      template: {
        method: 'GET',
        url: 'https://api.rarible.org/v0.1/collections/{collection_id}',
      },
      functions: {
        getCollectionInfo: ['collection_id'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://api.rarible.org/v0.1/items/byCollection?collection={collection_id}&size={size}&continuation={continuation}',
      },
      functions: {
        getCollection: ['collection_id', 'size', 'continuation'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://api.rarible.org/v0.1/items/byOwner?owner={owner_id}&size={size}&continuation={continuation}',
      },
      functions: {
        getByOwner: ['owner_id', 'size', 'continuation'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://api.rarible.org/v0.1/ownerships/byItem?itemId={itemId}',
      },
      functions: {
        getOwnersByItemId: ['itemId'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://api.rarible.org/v0.1/items/{itemId}',
      },
      functions: {
        getByItemId: ['itemId'],
      },
    },
    {
      template: {
        method: 'POST',
        url: 'https://api.rarible.org/v0.1/ownerships/search',
        body: {
          size: '{size:number}',
          continuation: '{continuation:string}',
          filter: {
            blockchains: ['{chain:string}'],
            owners: ['{owner_id:string}'],
            collections: ['{collection_id:string}'],
          },
        },
      },
      functions: {
        getCollectionForOwner: [
          'owner_id',
          'collection_id',
          'chain',
          'size',
          'continuation',
        ],
      },
    },
  ],
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class RaribleApiDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'RaribleAPI';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.RaribleAPI', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
