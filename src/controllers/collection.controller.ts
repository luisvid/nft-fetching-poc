import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import winston from 'winston';
import {ValidMarketplaces} from '../enums';
import {
  accessResponse,
  checkCID,
  failResponse,
  isValidMarketplace,
  isValidNetwork,
  successResponse,
} from '../enums/helpers';
import {LogConfig} from '../environment/environment';
import {Collection, CollectionFilter, CollectionResponse} from '../models';
import {CollectionRepository} from '../repositories';
import {
  MoralisApi,
  OpenseaApi,
  RaribleApi,
  SolanaApi,
  StakedNftsService,
} from '../services';

export class CollectionController {
  public logger = winston.loggers.get(LogConfig.logName);

  constructor(
    @repository(CollectionRepository)
    protected collectionRepository: CollectionRepository,
    @inject('services.OpenseaApi') protected openseaApiService: OpenseaApi,
    @inject('services.SolanaApi') protected solanaApiService: SolanaApi,
    @inject('services.RaribleApi') protected raribleApiService: RaribleApi,
    @inject('services.MoralisApi') protected moralisApiService: MoralisApi,
    @inject('services.StakedNftsService')
    protected stakedNftsService: StakedNftsService,
  ) {}

  /**
   *
   * GET /collections/market/{market}/id/{id}/info
   *
   * Fetch Collection Info By Network
   * markets API selection based on:
   * MARKET -  NETWORK - Criteria
   * MAGICEDEN SOLANA      by Slug
   * OPENSEA   POLYGON     by Slug
   * OPENSEA   ETHEREUM    by Slug
   * OPENSEA   BINANCE     by Slug
   * OPENSEA   ARBITRUM    by Slug
   * RARIBLE   IMMUTABLEX  by address
   *
   * @param network Network name
   * @param id Collection address or slug
   * @returns Collection
   */
  @get('/collections/marketplace/{marketplace}/network/{network}/id/{id}/info')
  async getCollectionsInfo(
    @param.path.string('marketplace') marketplace: string,
    @param.path.string('network') network: string,
    @param.path.string('id') id: string,
    @param.query.boolean('useCache') useCache = true,
  ): Promise<Collection> {
    if (!isValidMarketplace(marketplace)) {
      this.logger.warn(`Invalid marketplace value: ${marketplace}`, {
        controller: 'collection.ctrl',
        endpoint: 'get /collections/market/{market}/id/{id}/info',
      });
      return failResponse(
        'UNSUPPORTED_MARKETPLACE',
        `Invalid marketplace value: ${marketplace}`,
        null,
      );
    }
    if (!isValidNetwork(network)) {
      this.logger.warn(`Invalid network value: ${network}`, {
        controller: 'collection.ctrl',
        endpoint: 'get /collections/market/{market}/id/{id}/info',
      });
      return failResponse(
        'UNSUPPORTED_NETWORK',
        `Invalid network value: ${network}`,
        null,
      );
    }
    try {
      if (useCache) {
        // fetch collection from DB, if found return it
        const dbCollection = await this.collectionRepository.find({
          where: {id: network + ':' + id},
          fields: {
            stakedData: false,
            stakedTimestamp: false,
          },
        });
        if (dbCollection.length > 0) {
          return successResponse(dbCollection[0]);
        }
      }
      // if it doesn't exist in DB, or user ask to re-fetch collection info
      // call the corresponding api, get collection and save it in  DB
      let newCollection: Collection | null;
      switch (marketplace) {
        case ValidMarketplaces.MAGICEDEN:
          newCollection = await this.fetchMagicedenCollection(network, id);
          break;
        case ValidMarketplaces.OPENSEA:
          newCollection = await this.fetchOpenseaCollection(network, id);
          break;
        case ValidMarketplaces.RARIBLE:
          // Since 15/03/2023, only IMMUTABLEX collections can be import through RARIBLE
          // Since March 22, temporarily removed
          // if (network !== ValidNetworks.IMMUTABLEX)
          //   return failResponse(
          //     'UNSUPPORTED_NETWORK',
          //     `Invalid network value: ${network}. RARIBLE marketplace only supports ${ValidNetworks.IMMUTABLEX}`,
          //     null,
          //   );

          newCollection = await this.fetchRaribleCollection(network, id);
          break;
        default:
          this.logger.warn(`Invalid marketplace value: ${marketplace}`, {
            controller: 'collection.ctrl',
            endpoint: 'get /collections/market/{market}/id/{id}/info',
          });
          return failResponse(
            'UNSUPPORTED_MARKETPLACE',
            `Invalid marketplace value: ${marketplace}`,
            null,
          );
          break;
      }
      if (newCollection) {
        await this.saveCollectionInCache(newCollection);
        return successResponse(newCollection);
      } else {
        this.logger.warn(`Collection ${id} not found`, {
          controller: 'collection.ctrl',
          endpoint: 'get /collections/market/{market}/id/{id}/info',
        });
        return failResponse(
          'COLLECTION_NOT_FOUND',
          `Collection ${id} not found`,
          null,
        );
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'collection.ctrl',
        endpoint: 'get /collections/market/{market}/id/{id}/info',
      });
      return failResponse('FETCH_COLLECTION_ERROR', error, null);
    }
  }

  /**
   *
   * GET /collections/id/{id}/info
   *
   * Fetch Collection Info By ID
   *
   * @param id Collection address or slug
   * @returns Collection
   */
  @get('/collections/id/{id}/info')
  async getCollectionById(
    @param.path.string('id') id: string,
  ): Promise<Collection> {
    try {
      const dbCollection = await this.collectionRepository.find({
        where: {id: id},
        fields: {
          stakedData: false,
          stakedTimestamp: false,
        },
      });
      if (dbCollection.length > 0) {
        return successResponse(dbCollection[0]);
      } else {
        this.logger.warn(`Collection ${id} not found`, {
          controller: 'collection.ctrl',
          endpoint: 'get /collections/id/{id}/info',
        });
        return failResponse(
          'COLLECTION_NOT_FOUND',
          `Collection ${id} not found`,
          null,
        );
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'collection.ctrl',
        endpoint: 'get /collections/id/{id}/info',
      });
      return failResponse('FETCH_COLLECTION_ERROR', error, null);
    }
  }

  /**
   *
   * POST /collections/info
   *
   * Returns collection information from an ID array
   *
   * @returns Collection[]
   */
  @post('/collections/info')
  async getCollectionsInfoBatch(
    @requestBody() filter: CollectionFilter,
  ): Promise<CollectionResponse> {
    try {
      // fetch collections from DB
      const dbCollection = await this.collectionRepository.find({
        where: {id: {inq: filter.collectionIds}},
      });
      return new CollectionResponse({success: true, collections: dbCollection});
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'collection.ctrl',
        endpoint: 'post /collections/info',
      });
      return failResponse('FETCH_COLLECTION_ERROR', error, null);
    }
  }

  /**
   *
   * PATCH /collections/{id}
   *
   * Updates Collection Info by ID
   *
   * @param id Collection Id
   * @returns object Collection PATCH success
   */
  @patch('/collections/{id}')
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Collection, {partial: true}),
        },
      },
    })
    collection: Collection,
  ): Promise<object> {
    try {
      if (collection.stakedNftsEndpoint === null) {
        collection.stakedData = {};
        collection.stakedTimestamp = new Date(0).toJSON();
      }
      // validate endpoint and response
      const result = await this.stakedNftsService.validateStakedEndpoint(
        collection.stakedNftsEndpoint!,
      );
      if (result === 'OK') {
        await this.collectionRepository.updateById(id, collection);
        return accessResponse(true);
      } else {
        this.logger.warn(`Endpoint validation error: ${result}`, {
          controller: 'collection.ctrl',
          endpoint: 'patch /collections/{id}',
        });
        return failResponse('ENDPOINT_VALIDATION_ERROR', result, null);
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'collection.ctrl',
        endpoint: 'patch /collections/{id}',
      });
      return failResponse('PATCH_COLLECTION_ERROR', error, null);
    }
  }

  /**
   * saves collection info in the DB
   * @param collection Collection
   * @returns Collection
   */
  async saveCollectionInCache(
    collection: Collection,
  ): Promise<Collection | null> {
    try {
      const foundColl = await this.collectionRepository.findOne({
        where: {id: collection.id},
      });
      if (foundColl) {
        await this.collectionRepository.update(collection);
        return collection;
      } else {
        return await this.collectionRepository.create(collection);
      }
    } catch (error) {
      console.error('Error saveCollectionInCache(): %s ', error);
      this.logger.error(error.message, {
        controller: 'collection.ctrl',
        method: `saveCollectionInCache`,
      });
      return null;
    }
  }

  /**
   * Fetch a Solana Collection via the MagicEden API by slug
   * Convert MagicEden API response to collection model
   * @param network string
   * @param id string
   * @returns Collection
   */
  async fetchMagicedenCollection(
    network: string,
    id: string,
  ): Promise<Collection | null> {
    try {
      const apiResponse = await this.solanaApiService.getCollectionInfo(id);
      return new Collection({
        id: network + ':' + id,
        name: apiResponse.name,
        address: null,
        network,
        market: 'MAGICEDEN',
        description: apiResponse.description,
        image: apiResponse.image,
        twitter: apiResponse.twitter,
        discord: apiResponse.discord,
      });
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'collection.ctrl',
        method: `fetchMagicedenCollection(${network},${id})`,
      });
      return null;
    }
  }

  /**
   * Fetch a Ethereum and Polygon Collection via the OpenSea API by slug
   * Convert OpenSea API response to collection model
   * @param network string
   * @param id string
   * @returns Collection
   */
  async fetchOpenseaCollection(
    network: string,
    id: string,
  ): Promise<Collection | null> {
    try {
      const apiResponse = await this.openseaApiService.getCollectionInfo(id);
      let address = null;
      if (
        apiResponse.collection.primary_asset_contracts &&
        apiResponse.collection.primary_asset_contracts.length > 0
      ) {
        address =
          apiResponse.collection.primary_asset_contracts[0].address ?? null;
      }
      return new Collection({
        id: network + ':' + id,
        name: apiResponse.collection.name,
        address,
        network,
        market: 'OPENSEA',
        description: apiResponse.collection.description,
        image: checkCID(apiResponse.collection.image_url),
        twitter: apiResponse.collection.twitter_username
          ? `https://twitter.com/${apiResponse.collection.twitter_username}`
          : '',
        discord: apiResponse.collection.discord_url,
      });
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'collection.ctrl',
        method: `fetchOpenseaCollection(${network},${id})`,
      });
      return null;
    }
  }

  /**
   * Fetch only immutablex
   * collections via the Rarible API by address only
   * Raribe does not suppor search by slug
   * Convert Rarible API response to collection model
   * @param network string
   * @param id string
   * @returns Collection
   */
  async fetchRaribleCollection(
    network: string,
    id: string,
  ): Promise<Collection | null> {
    try {
      const apiResponse = await this.raribleApiService.getCollectionInfo(
        network + ':' + id,
      );
      let image = null;
      if (apiResponse.meta?.content && apiResponse.meta.content.length > 0) {
        image = apiResponse.meta.content[0].url
          ? checkCID(apiResponse.meta.content[0].url)
          : null;
      }
      return new Collection({
        id: network + ':' + id,
        name:
          apiResponse.name !== ''
            ? apiResponse.name
            : apiResponse.meta
            ? apiResponse.meta.name
            : '',
        address: id,
        network,
        market: 'RARIBLE',
        description: apiResponse.meta
          ? apiResponse.meta.description
            ? apiResponse.meta.description
            : apiResponse.name
          : apiResponse.name,
        image,
      });
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'collection.ctrl',
        method: `fetchRaribleCollection(${network},${id})`,
      });
      return null;
    }
  }
}
