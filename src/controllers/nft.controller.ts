import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {post, requestBody} from '@loopback/rest';
import winston from 'winston';
import {ValidMarketplaces, ValidNetworks} from '../enums';
import {
  SOLANA_REGEX,
  SearchCriteria,
  accessResponse,
  checkCID,
  envNumberOrDefault,
  failResponse,
  getMoralisNetworkCode,
  searchCriterias,
  successResponse,
} from '../enums/helpers';
import {LogConfig} from '../environment/environment';
import {
  Filter,
  SearchFilter,
  UserCollection,
  UserNft,
  UserResponse,
} from '../models';
import {
  CollectionRepository,
  UserCollectionRepository,
  UserResponseRepository,
} from '../repositories';
import {
  MoralisApi,
  OpenseaApi,
  RaribleApi,
  SolanaApi,
  StakedNftsService,
} from '../services';

const REDIS_EXPIRATION = envNumberOrDefault('REDIS_EXPIRATION_ML', 30000);

export class NftController {
  public logger = winston.loggers.get(LogConfig.logName);

  constructor(
    @repository(UserResponseRepository)
    protected userResponseRepository: UserResponseRepository,
    @repository(UserCollectionRepository)
    protected userCollectionRepository: UserCollectionRepository,
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
   * POST /nft-access
   *
   * Validates that the user has at least one NFT
   * from the specified collections in one of their wallets
   *
   */
  @post('/nft-access')
  async getNftAccess(@requestBody() filter: Filter): Promise<object> {
    try {
      if (filter.owner.length > 0 && filter.collection.length > 0) {
        const uResponse = await this.getResponse(
          this.getSearchFilter(filter),
          '',
          true,
          true,
        );
        return accessResponse(uResponse.nftAccess!);
      } else {
        this.logger.warn(`Filter error: Owner and Collection are required`, {
          controller: 'nft.ctrl',
          endpoint: 'post /nft-access',
          filter,
        });
        return failResponse(
          'INVALID_FILTER',
          'Filter format error: Owner and Collection are required',
          null,
        );
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'nft.ctrl',
        endpoint: 'post /nft-access',
      });
      return failResponse('NFT_FETCH_ERROR', error, null);
    }
  }

  /**
   *
   * POST /nfts
   *
   * Fetch NFTs Collections of the corresponding networks and marketplaces
   *
   */
  @post('/nfts')
  async getNfts(@requestBody() filter: Filter): Promise<UserResponse> {
    try {
      if (filter.owner.length > 0 && filter.collection.length > 0) {
        const uResponse = await this.getResponse(
          this.getSearchFilter(filter),
          filter.userId!,
          filter.useCache === undefined ? true : filter.useCache,
          false,
        );
        return successResponse(uResponse);
      } else {
        this.logger.warn(`Filter error: Owner and Collection are required`, {
          controller: 'nft.ctrl',
          endpoint: 'post /nfts',
          filter,
        });
        return failResponse(
          'INVALID_FILTER',
          'Filter format error: Owner and Collection are required',
          null,
        );
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'nft.ctrl',
        endpoint: 'post /nfts',
      });
      return failResponse('NFT_FETCH_ERROR', error, null);
    }
  }

  /**
   * create the search array filter from the endpoint filter nftect
   * @param filter Filter
   * @returns SearchFilter[]
   */
  getSearchFilter(filter: Filter): SearchFilter[] {
    const searchFilterArray: SearchFilter[] = [];

    for (const ownerItem of filter.owner!) {
      const searchItem = new SearchFilter({
        network: ownerItem.split(':')[0],
        wallet: ownerItem.split(':')[1],
        collectionA: [],
        collectionS: [],
      });
      // checks if the collection id is an eth or solana address,
      // or a slug and adds them to the corresponding array
      for (const collItem of filter.collection!) {
        if (collItem.split(':')[0] === searchItem.network) {
          if (collItem.split(':')[1].startsWith('0x')) {
            searchItem.collectionA?.push(collItem.split(':')[1]);
          } else {
            if (SOLANA_REGEX.test(collItem.split(':')[1]))
              searchItem.collectionA?.push(collItem.split(':')[1]);
            else searchItem.collectionS?.push(collItem.split(':')[1]);
          }
        }
      }
      searchFilterArray.push(searchItem);
    }
    return searchFilterArray;
  }

  /**
   *
   * Create the response object
   * based on the networks requested in the filter object
   * @param searchFilter SearchFilter[]
   * @param userId string,
   * @param useCache boolean,
   * @param nftAccess boolean,
   * @returns Promise<UserResponse>
   *
   */
  async getResponse(
    searchFilter: SearchFilter[],
    userId: string,
    useCache: boolean,
    nftAccess: boolean,
  ): Promise<UserResponse> {
    const uResponse = new UserResponse({
      userId,
      nftAccess: false,
      data: [],
    });

    // iterate the searchFilter items
    for (const filter of searchFilter) {
      let retCollections: boolean | UserCollection[] = [];

      switch (filter.network) {
        case ValidNetworks.SOLANA:
          for (const criteria of searchCriterias) {
            if (this.searchByCriteria(criteria, filter)) {
              retCollections = await this.getSolanaCollections(
                criteria === 'SLUG'
                  ? ValidMarketplaces.MAGICEDEN
                  : ValidMarketplaces.RARIBLE,
                filter.wallet!,
                criteria === 'SLUG' ? filter.collectionS! : filter.collectionA!,
                useCache,
                nftAccess,
              );
              // validating nftAccess finding data is enough to get out of the loop
              if (typeof retCollections === 'boolean') {
                uResponse.nftAccess = retCollections;
                if (retCollections) break;
              } else if (retCollections)
                uResponse.data!.push(...retCollections);
            }
          }
          break;

        case ValidNetworks.BINANCE:
        case ValidNetworks.ARBITRUM:
        case ValidNetworks.POLYGON:
        case ValidNetworks.ETHEREUM:
          for (const criteria of searchCriterias) {
            if (this.searchByCriteria(criteria, filter)) {
              retCollections = await this.getEthEvmCollections(
                criteria === 'SLUG'
                  ? ValidMarketplaces.OPENSEA
                  : ValidMarketplaces.RARIBLE,
                filter.network!,
                filter.wallet!,
                criteria === 'SLUG' ? filter.collectionS! : filter.collectionA!,
                useCache,
                nftAccess,
              );
              if (typeof retCollections === 'boolean') {
                uResponse.nftAccess = retCollections;
                if (retCollections) break;
              } else if (retCollections)
                uResponse.data!.push(...retCollections);
            }
          }
          break;

        case ValidNetworks.IMMUTABLEX:
          retCollections = await this.getImmutablexCollections(
            filter.network!,
            filter.wallet!,
            filter.collectionA!,
            useCache,
            nftAccess,
          );
          if (typeof retCollections === 'boolean')
            uResponse.nftAccess = retCollections;
          else if (retCollections) uResponse.data!.push(...retCollections);
          break;

        default:
          break;
      }
      // if nftAccess is being validated, finding data is enough to get out of the loop
      if (uResponse.nftAccess) break;
    }
    if (nftAccess) return uResponse;
    else return this.prepareResponse(uResponse);
  }

  /**
   * removes data not needed by the client
   * removes collectios with no NFTs
   * groups collections by collectionId
   * @param objResponse
   * @returns UserResponse
   */
  prepareResponse(objResponse: UserResponse): UserResponse {
    try {
      const userColls: Record<string, UserCollection> = {};
      const finalResponse = new UserResponse({
        userId: objResponse.userId,
      });
      for (const coll of objResponse.data!) {
        if (coll.userNfts && coll.userNfts.length > 0) {
          if (!userColls[coll.collectionId!]) {
            userColls[coll.collectionId!] = new UserCollection({
              collectionId: coll.collectionId!,
              userNfts: [],
            });
          }
          userColls[coll.collectionId!].userNfts!.push(...coll.userNfts!);
        }
      }
      const retColls = Object.keys(userColls).map(
        collectionId => userColls[collectionId],
      );
      finalResponse.data = retColls;
      return finalResponse;
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'nft.ctrl',
        method: `prepareResponse(${objResponse})`,
      });
    }
    return objResponse;
  }

  /**
   * Search Solana NFTs in Redis, if not found
   * fetch NFTs through OpenSea by slug
   * or through Rarible by address
   * @param api ValidMarketplaces
   * @param wallet string
   * @param searchedColls string[]
   * @param useCache boolean
   * @param nftAccess boolean
   * @returns Promise<boolean | UserCollection[]>
   */
  async getSolanaCollections(
    api: ValidMarketplaces,
    wallet: string,
    searchedColls: string[],
    useCache: boolean,
    nftAccess: boolean,
  ): Promise<boolean | UserCollection[]> {
    let respColl: UserCollection[] = [];
    for (const collectionId of searchedColls) {
      // look for collection in Redis
      const redisColl = await this.getCollectionFromRedis(
        ['SOLANA', wallet, collectionId].join(':'),
      );

      if (redisColl && useCache) {
        // nftAccess: finding data is enough to get out of the loop
        if (nftAccess && redisColl.userNfts!.length > 0) return true;
        respColl.push(redisColl);
      } else {
        // if it is not in redis, fetch all requested collections
        // validating nftAccess only returns true or false
        if (api === ValidMarketplaces.MAGICEDEN) {
          if (nftAccess)
            return this.validateSolanaCollections(wallet!, searchedColls);
          else
            respColl = await this.fetchSolanaCollections(
              wallet!,
              searchedColls,
            );
        }
        if (api === ValidMarketplaces.RARIBLE) {
          if (nftAccess)
            return this.validateImxRaribleCollection(
              wallet,
              'SOLANA',
              searchedColls,
            );
          else
            respColl = await this.fetchImxRaribleCollection(
              wallet,
              'SOLANA',
              searchedColls,
            );
        }
        break;
      }
    }
    if (nftAccess) return false;
    else return respColl;
  }

  /**
   * Search Immutablex NFTs in Redis, if not found
   * fetch NFTs through Rarible by address
   * @param network string,
   * @param wallet string
   * @param searchedColls string[]
   * @param useCache boolean
   * @param nftAccess boolean
   * @returns Promise<boolean | UserCollection[]>
   */
  async getImmutablexCollections(
    network: string,
    wallet: string,
    searchedColls: string[],
    useCache: boolean,
    nftAccess: boolean,
  ): Promise<boolean | UserCollection[]> {
    let respColl: UserCollection[] = [];
    for (const collectionId of searchedColls) {
      // look for collection in Redis
      const redisColl = await this.getCollectionFromRedis(
        [network, wallet, collectionId].join(':'),
      );
      if (redisColl && useCache) {
        // nftAccess:finding data is enough to get out of the loop
        if (nftAccess && redisColl.userNfts!.length > 0) return true;
        respColl.push(redisColl);
      } else {
        // if it is not in redis, fetch all requested collections
        // validating nftAccess only returns true or false
        if (nftAccess)
          return this.validateImxRaribleCollection(
            wallet,
            network,
            searchedColls,
          );
        else
          respColl = await this.fetchImxRaribleCollection(
            wallet,
            network,
            searchedColls,
          );
        break;
      }
    }
    if (nftAccess) return false;
    else return respColl;
  }

  /**
   * Search Eth, BSC, Polygon & Arbitrum NFTs in Redis,
   * if not found fetch NFTs by slug through
   * OpenSea or Moralis, or through Rarible by address
   * @param api ValidMarketplaces
   * @param network string
   * @param wallet string
   * @param searchedColls string[]
   * @param useCache boolean
   * @param nftAccess boolean
   * @returns Promise<boolean | UserCollection[]>
   */
  async getEthEvmCollections(
    api: ValidMarketplaces,
    network: string,
    wallet: string,
    searchedColls: string[],
    useCache: boolean,
    nftAccess: boolean,
  ): Promise<boolean | UserCollection[]> {
    let respColl: UserCollection[] = [];
    for (const collectionId of searchedColls) {
      // look for collection in Redis
      const redisColl = await this.getCollectionFromRedis(
        [network, wallet, collectionId].join(':'),
      );
      if (redisColl && useCache) {
        // nftAccess: finding data is enough to get out of the loop
        if (nftAccess && redisColl.userNfts!.length > 0) return true;
        respColl.push(redisColl);
      } else {
        // if it is not in redis, fetch all requested collections
        // validating nftAccess only returns true or false
        if (
          api === ValidMarketplaces.OPENSEA &&
          network === ValidNetworks.ETHEREUM
        ) {
          if (nftAccess)
            return this.validateEthOpenSeaCollections(
              wallet,
              network,
              searchedColls,
            );
          else
            respColl = await this.fetchEthOpenSeaCollections(
              wallet,
              network,
              searchedColls,
            );
        }
        // Evm compatibles by slug uses Moralis, OpenSea does not correctly
        // return assets from Polygon, Binance and Arbitrum by slug
        if (
          api === ValidMarketplaces.OPENSEA &&
          (network === ValidNetworks.POLYGON ||
            network === ValidNetworks.BINANCE ||
            network === ValidNetworks.ARBITRUM)
        ) {
          if (nftAccess)
            return this.validateEvmMoralisCollections(
              wallet,
              network,
              searchedColls,
            );
          else {
            respColl = await this.fetchEvmMoralisCollections(
              wallet,
              network,
              searchedColls,
            );
          }
        }
        // by address always use Rarible
        if (api === ValidMarketplaces.RARIBLE) {
          if (nftAccess)
            return this.validateImxRaribleCollection(
              wallet,
              network,
              searchedColls,
            );
          else
            respColl = await this.fetchImxRaribleCollection(
              wallet,
              network,
              searchedColls,
            );
        }
        break;
      }
    }
    if (nftAccess) return false;
    else return respColl;
  }

  /**
   * Search Solana NFTs by slug through MagicEden API
   * Convert MagicEden API response to collection model
   * @param wallet string
   * @param requestedColls string[] requested collections
   * @returns UserCollection
   */
  async fetchSolanaCollections(
    wallet: string,
    requestedColls: string[],
  ): Promise<UserCollection[]> {
    const nftsByCollection: Record<string, UserCollection> = {};
    const network = ValidNetworks.SOLANA;
    try {
      // get collections for which the wallet may contain NFTs
      const searchedColls = await this.getCollectionsFromDb(network);
      // put together a single array of collections, without repeated ones
      requestedColls.forEach(value => {
        if (!searchedColls?.includes(value)) searchedColls?.push(value);
      });

      // create a new record with an empty collection for all searched colls
      this.initRecords(wallet, network, searchedColls!, nftsByCollection);
      // fetch NFTs from market API
      const result = await this.solanaApiService.getWalletTokens(
        wallet,
        0,
        500,
      );
      // TODO: pagination
      const apiNfts = result.body;
      if (apiNfts && apiNfts.length > 0) {
        this.extractNftsFromSolanaApi(
          wallet,
          network,
          searchedColls!,
          nftsByCollection,
          apiNfts,
        );
      }
      // check if there are NFTs in staking.
      const stakedNftsMint = await this.stakedNftsService.getStakedNfts(
        wallet,
        ValidNetworks.SOLANA,
        searchedColls as string[],
      );
      if (stakedNftsMint.length > 0) {
        const stakedNfts: object[] = [];
        // fetch info of staked NFTs
        for (const mintAddress of stakedNftsMint) {
          stakedNfts.push(
            await this.solanaApiService.getTokenByMintAddress(mintAddress),
          );
        }
        this.extractNftsFromSolanaApi(
          wallet,
          network,
          searchedColls!,
          nftsByCollection,
          stakedNfts,
        );
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'nft.ctrl',
        method: `fetchSolanaCollections()`,
      });
    }
    return this.saveToCacheReturnRequested(nftsByCollection, requestedColls);
  }

  /**
   * Validates that the user has at least one NFT
   * in one of the specified collections.
   * @param wallet string
   * @param requestedColls string[] requested collections
   * @returns Promise<boolean>
   */
  async validateSolanaCollections(
    wallet: string,
    requestedColls: string[],
  ): Promise<boolean> {
    try {
      const result = await this.solanaApiService.getWalletTokens(
        wallet,
        0,
        500,
      );
      if (result.body && result.body.length > 0) {
        for (const nft of result.body) {
          // finding at least one NFT in one of the requested collections is enough
          if (requestedColls.includes(nft.collection)) return true;
        }
      }
      // If no NFTs were found, check if there are NFTs staked
      const stakedNfts = await this.stakedNftsService.getStakedNfts(
        wallet,
        ValidNetworks.SOLANA,
        requestedColls,
      );
      if (stakedNfts.length > 0) return true;
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'nft.ctrl',
        method: `validateSolanaCollections()`,
      });
    }
    return false;
  }

  /**
   * Fetch ImmutableX and Polygon collections
   * convert API response to collection model
   * @param wallet string
   * @param requestedColls string[]
   * @returns UserCollection
   * @param network string
   */
  async fetchImxRaribleCollection(
    wallet: string,
    network: string,
    requestedColls: string[],
  ): Promise<UserCollection[]> {
    let cursorNext = '';
    const nftsByCollection: Record<string, UserCollection> = {};
    try {
      // get collections for which the wallet may contain NFTs
      const searchedColls = await this.getCollectionsFromDb(network);
      // put together a single array of collections, without repeated ones
      requestedColls.forEach(value => {
        if (!searchedColls?.includes(value)) searchedColls?.push(value);
      });

      // create a new record with an empty collection for all searched colls
      this.initRecords(wallet, network, searchedColls!, nftsByCollection);

      do {
        const networkPrefix = network === 'SOLANA' ? network : 'ETHEREUM';
        const apiNfts = await this.raribleApiService.getByOwner(
          [networkPrefix, wallet].join(':'),
          30,
          cursorNext,
        );
        if (apiNfts && apiNfts.items.length > 0) {
          cursorNext = apiNfts.continuation;
          this.extractNftsFromRaribleApi(
            wallet,
            network,
            searchedColls!,
            nftsByCollection,
            apiNfts.items,
          );
        } else cursorNext = '';
      } while (cursorNext);
      // check if there are NFTs in staking.
      const stakedNftsId = await this.stakedNftsService.getStakedNfts(
        wallet,
        network,
        searchedColls as string[],
      );
      if (stakedNftsId.length > 0) {
        const stakedNfts: object[] = [];
        // fetch info of staked NFTs
        for (const nftId of stakedNftsId) {
          // expect item Id has the format {blockchain}:{address}:{tokenId}
          stakedNfts.push(
            await this.raribleApiService.getByItemId(
              [network, nftId].join(':'),
            ),
          );
        }
        this.extractNftsFromRaribleApi(
          wallet,
          network,
          searchedColls!,
          nftsByCollection,
          stakedNfts,
        );
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'nft.ctrl',
        method: `fetchImxRaribleCollection()`,
      });
    }
    return this.saveToCacheReturnRequested(nftsByCollection, requestedColls);
  }

  /**
   * Validates that the user has at least one NFT
   * in one of the specified collections.
   * @param wallet string
   * @param network string
   * @param requestedColls string[] requested collections
   * @returns Promise<boolean>
   */
  async validateImxRaribleCollection(
    wallet: string,
    network: string,
    requestedColls: string[],
  ): Promise<boolean> {
    let cursorNext = '';
    try {
      do {
        const networkPrefix = network === 'SOLANA' ? network : 'ETHEREUM';
        const apiNfts = await this.raribleApiService.getByOwner(
          [networkPrefix, wallet].join(':'),
          30,
          cursorNext,
        );
        if (apiNfts && apiNfts.items.length > 0) {
          cursorNext = apiNfts.continuation;
          for (const nft of apiNfts.items) {
            // finding at least one NFT in one of the requested collections is enough
            if (
              nft.collection &&
              requestedColls.includes(nft.collection.split(':')[1])
            )
              return true;
          }
        } else cursorNext = '';
      } while (cursorNext);
      // If no NFTs were found, check if there are NFTs staked
      const stakedNfts = await this.stakedNftsService.getStakedNfts(
        wallet,
        network,
        requestedColls,
      );
      if (stakedNfts.length > 0) return true;
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'nft.ctrl',
        method: `validateImxRaribleCollection()`,
      });
    }
    return false;
  }

  /**
   * Fetch Ethereum NFTs through OpenSea API
   * convert OpenSea API response to collection model
   * @param wallet string
   * @param network string
   * @param requestedColls string[]
   * @returns UserCollection
   */
  async fetchEthOpenSeaCollections(
    wallet: string,
    network: string,
    requestedColls: string[],
  ): Promise<UserCollection[]> {
    let cursorNext = '';
    const nftsByCollection: Record<string, UserCollection> = {};
    try {
      // get collections for which the wallet may contain NFTs
      const searchedColls = await this.getCollectionsFromDb(network);
      // put together a single array of collections, without repeated ones
      requestedColls.forEach(value => {
        if (!searchedColls?.includes(value)) searchedColls?.push(value);
      });

      // create a new record with an empty collection for all searched colls
      this.initRecords(wallet, network, searchedColls!, nftsByCollection);
      do {
        const apiNfts = await this.openseaApiService.getAssetsForOwner(
          wallet,
          100,
          cursorNext,
        );
        if (apiNfts && apiNfts.assets.length > 0) {
          cursorNext = apiNfts.next;
          this.extractNftsFromOpenseaApi(
            wallet,
            network,
            searchedColls!,
            nftsByCollection,
            apiNfts.assets,
          );
        }
      } while (cursorNext);
      // check if there are NFTs in staking.
      const stakedNftsId = await this.stakedNftsService.getStakedNfts(
        wallet,
        network,
        searchedColls as string[],
      );
      if (stakedNftsId.length > 0) {
        const stakedNfts: object[] = [];
        for (const nftId of stakedNftsId) {
          // expect item Id has the format {contractAddress}:{tokenId}
          stakedNfts.push(
            await this.openseaApiService.getAssetsByItemId(
              nftId.split(':')[0],
              nftId.split(':')[1],
            ),
          );
        }
        this.extractNftsFromOpenseaApi(
          wallet,
          network,
          searchedColls!,
          nftsByCollection,
          stakedNfts,
        );
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'nft.ctrl',
        method: `fetchEthOpenSeaCollections()`,
      });
    }
    return this.saveToCacheReturnRequested(nftsByCollection, requestedColls);
  }

  /**
   * Validates that the user has at least one NFT
   * in one of the specified collections.
   * @param wallet string
   * @param network string
   * @param requestedColls string[] requested collections
   * @returns Promise<boolean>
   */
  async validateEthOpenSeaCollections(
    wallet: string,
    network: string,
    requestedColls: string[],
  ): Promise<boolean> {
    let cursorNext = '';
    try {
      do {
        const apiNfts = await this.openseaApiService.getAssetsForOwner(
          wallet,
          100,
          cursorNext,
        );
        if (apiNfts && apiNfts.assets.length > 0) {
          cursorNext = apiNfts.next;
          for (const nft of apiNfts.assets) {
            if (requestedColls?.includes(nft.collection.slug)) {
              // finding at least one NFT in one of the requested collections is enough
              return true;
            }
          }
        }
      } while (cursorNext);
      // If no NFTs were found, check if there are NFTs staked for
      // that collection (if the collection provides that information)
      const stakedNfts = await this.stakedNftsService.getStakedNfts(
        wallet,
        network,
        requestedColls,
      );
      if (stakedNfts.length > 0) return true;
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'nft.ctrl',
        method: `validateEthPolygonOSCollections()`,
      });
    }
    return false;
  }

  /**
   * Fetch Polygon NFTs by slug through Moralis API
   * OpenSea does not work with Polygon by slug
   * convert Morlis API response to collection model
   * @param wallet string
   * @param network string
   * @param requestedColls string[]
   * @returns UserCollection
   */
  async fetchEvmMoralisCollections(
    wallet: string,
    network: string,
    requestedColls: string[],
  ): Promise<UserCollection[]> {
    let cursorNext = '';
    const nftsByCollection: Record<string, UserCollection> = {};
    try {
      // complete slug array with addresses
      const completeReqColls = await this.addAddressToSlugCollections(
        requestedColls,
      );
      // get collections for which the wallet may contain NFTs
      const searchedColls = await this.getCollectionsFromDb(network, false);
      // put together a single array of collections, without repeated ones
      completeReqColls.forEach(value => {
        if (!searchedColls?.includes(value)) searchedColls?.push(value);
      });

      // create a new record with an empty collection for all searched colls
      this.initRecords(wallet, network, searchedColls!, nftsByCollection, true);
      do {
        const apiNfts = await this.moralisApiService.getNFTsForWallet(
          wallet,
          getMoralisNetworkCode(network),
          100,
          cursorNext,
        );
        if (apiNfts && apiNfts.result.length > 0) {
          cursorNext = apiNfts.cursor;
          this.extractNftsFromMoralisApi(
            wallet,
            network,
            searchedColls!,
            nftsByCollection,
            apiNfts.result,
          );
        }
      } while (cursorNext);
      // check if there are NFTs in staking.
      const stakedNftsId = await this.stakedNftsService.getStakedNfts(
        wallet,
        network,
        searchedColls as string[],
      );
      if (stakedNftsId.length > 0) {
        const stakedNfts: object[] = [];
        for (const nftId of stakedNftsId) {
          // expect item Id has the format {contractAddress}:{tokenId}
          stakedNfts.push(
            await this.moralisApiService.getNFTByTokenId(
              nftId.split(':')[0],
              nftId.split(':')[1],
              getMoralisNetworkCode(network),
            ),
          );
        }
        this.extractNftsFromMoralisApi(
          wallet,
          network,
          searchedColls!,
          nftsByCollection,
          stakedNfts,
        );
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'nft.ctrl',
        method: `fetchPolygonMoralisCollections()`,
      });
    }
    return this.saveToCacheReturnRequested(nftsByCollection, requestedColls);
  }

  /**
   * Validates that the user has at least one NFT
   * in one of the specified collections.
   * @param wallet string
   * @param network string
   * @param requestedColls string[] requested collections
   * @returns Promise<boolean>
   */
  async validateEvmMoralisCollections(
    wallet: string,
    network: string,
    requestedColls: string[],
  ): Promise<boolean> {
    let cursorNext = '';
    try {
      // complete slug array with addresses
      requestedColls = await this.addAddressToSlugCollections(requestedColls);
      do {
        const apiNfts = await this.moralisApiService.getNFTsForWallet(
          wallet,
          getMoralisNetworkCode(network),
          100,
          cursorNext,
        );
        if (apiNfts && apiNfts.result.length > 0) {
          cursorNext = apiNfts.cursor;
          for (const nft of apiNfts.result) {
            const found = requestedColls!.find(a =>
              a!.includes(nft.token_address),
            );
            if (found) return true;
          }
        }
      } while (cursorNext);
      // If no NFTs were found, check if there are NFTs staked for
      // that collection (if the collection provides that information)
      const stakedNfts = await this.stakedNftsService.getStakedNfts(
        wallet,
        network,
        requestedColls,
      );
      if (stakedNfts.length > 0) return true;
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'nft.ctrl',
        method: `validatePolygonMoralisCollections()`,
      });
    }
    return false;
  }

  /**
   * create a new record with an empty collection for all searched colls
   *
   * @param wallet string
   * @param network string
   * @param searchedColls string[] requested collections
   * @param nftsByCollection Record<string, UserCollection>
   * @param collNameAddress in some cases de coll name is {name}:{address}
   */
  initRecords(
    wallet: string,
    network: string,
    searchedColls: (string | undefined)[],
    nftsByCollection: Record<string, UserCollection>,
    collNameAddress = false,
  ) {
    for (const coll of searchedColls!) {
      const collName = collNameAddress ? coll?.split(':')[0] : coll;
      const collectionId = [network, wallet, collName].join(':');
      if (!nftsByCollection[collectionId]) {
        nftsByCollection[collectionId] = new UserCollection({
          id: collectionId,
          collectionId: [network, collName].join(':'),
          userNfts: [],
        });
      }
    }
  }

  /**
   * Loop through the MAGICEDEN API result and return the user's NFTs
   * that correspond to the searched collections.
   * @param wallet string
   * @param network string
   * @param searchedColls string[] requested collections
   * @param nftsByCollection Record<string, UserCollection>
   * @param apiNfts: any[] API result
   */
  extractNftsFromSolanaApi(
    wallet: string,
    network: string,
    searchedColls: (string | undefined)[],
    nftsByCollection: Record<string, UserCollection>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiNfts: any[],
  ) {
    for (const nft of apiNfts) {
      if (searchedColls?.includes(nft.collection)) {
        const collectionId = [network, wallet, nft.collection].join(':');
        nftsByCollection[collectionId].userNfts!.push(
          new UserNft({
            tokenId: nft.mintAddress,
            name: nft.name,
            image: checkCID(nft.image),
            attributes: nft.attributes,
          }),
        );
      }
    }
  }

  /**
   * Loop through the RARIBLE API result and return the user's NFTs
   * that correspond to the searched collections.
   * @param wallet string
   * @param network string
   * @param searchedColls string[] requested collections
   * @param nftsByCollection Record<string, UserCollection>
   * @param apiNfts: any[] API result
   */
  extractNftsFromRaribleApi(
    wallet: string,
    network: string,
    searchedColls: (string | undefined)[],
    nftsByCollection: Record<string, UserCollection>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiNfts: any[],
  ) {
    for (const nft of apiNfts) {
      if (
        nft.collection &&
        searchedColls?.includes(nft.collection.split(':')[1])
      ) {
        const collectionId = [
          network,
          wallet,
          nft.collection.split(':')[1],
        ].join(':');
        const image = nft.meta.content[0].url
          ? checkCID(nft.meta.content[0].url)
          : null;
        nftsByCollection[collectionId].userNfts!.push(
          new UserNft({
            tokenId: nft.tokenId,
            name: nft.meta ? nft.meta.name : '',
            image: image,
            attributes: nft.meta ? nft.meta.attributes : [],
          }),
        );
      }
    }
  }

  /**
   * Loop through the OPENSEA API result and return the user's NFTs
   * that correspond to the searched collections.
   * @param wallet string
   * @param network string
   * @param searchedColls string[] requested collections
   * @param nftsByCollection Record<string, UserCollection>
   * @param apiNfts: any[] API result
   */
  extractNftsFromOpenseaApi(
    wallet: string,
    network: string,
    searchedColls: (string | undefined)[],
    nftsByCollection: Record<string, UserCollection>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiNfts: any[],
  ) {
    for (const nft of apiNfts) {
      if (searchedColls?.includes(nft.collection.slug)) {
        const collectionId = [network, wallet, nft.collection.slug].join(':');
        nftsByCollection[collectionId].userNfts!.push(
          new UserNft({
            tokenId: nft.token_id,
            name: nft.name,
            image: nft.image_url ? checkCID(nft.image_url) : null,
            attributes: nft.traits ? nft.traits : null,
          }),
        );
      }
    }
  }

  /**
   * Loop through the MORALIS API result and return the user's NFTs
   * that correspond to the searched collections.
   * @param wallet string
   * @param network string
   * @param searchedColls string[] requested collections
   * @param nftsByCollection Record<string, UserCollection>
   * @param apiNfts: any[] API result
   */
  extractNftsFromMoralisApi(
    wallet: string,
    network: string,
    searchedColls: (string | undefined)[],
    nftsByCollection: Record<string, UserCollection>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiNfts: any[],
  ) {
    for (const nft of apiNfts) {
      const found = searchedColls!.find(a => a!.includes(nft.token_address));
      if (found) {
        const collectionId = [network, wallet, found!.split(':')[0]].join(':');
        const metadata = JSON.parse(nft.metadata);
        nftsByCollection[collectionId].userNfts!.push(
          new UserNft({
            tokenId: nft.token_id,
            name: metadata ? (metadata.name ? metadata.name : nft.name) : null,
            image: metadata
              ? metadata.image
                ? checkCID(metadata.image)
                : null
              : null,
            attributes: metadata
              ? metadata.attributes
                ? metadata.attributes
                : null
              : null,
          }),
        );
      }
    }
  }

  /**
   * save all found collections to Redis
   * return only requested collections
   * @param nftsByCollection
   * @param searchedColls
   * @returns Promise<UserCollection[]>
   */
  async saveToCacheReturnRequested(
    nftsByCollection: Record<string, UserCollection>,
    searchedColls: string[],
  ): Promise<UserCollection[]> {
    // save all found collections to Redis
    await Promise.all(
      Object.keys(nftsByCollection).map(collectionId => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.saveCollectionRedis(
          nftsByCollection[collectionId],
          REDIS_EXPIRATION,
        );
      }),
    );
    // return only searched collections
    const retColls = Object.keys(nftsByCollection).map(
      collectionId => nftsByCollection[collectionId],
    );
    const responseCollections = retColls.filter(obj => {
      return searchedColls.includes(obj.id!.split(':')[2]);
    });
    return responseCollections;
  }

  /**
   * Get array of collections id from stored collections
   * @param network string
   * @param onlyId boolean: Indicates if the address is also returned
   * @returns Array of collections symbols
   */
  async getCollectionsFromDb(network: string, onlyId = true) {
    try {
      const dbCollections = await this.collectionRepository.find({
        where: {network},
        fields: {id: true, address: true},
      });
      if (dbCollections) {
        if (onlyId) return dbCollections.map(({id}) => id?.split(':')[1]);
        else
          return dbCollections.map(
            ({id, address}) => id!.split(':')[1] + ':' + address!,
          );
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'nft.ctrl',
        method: `getCollectionsFromDb(${network}, ${onlyId})`,
      });
      return undefined;
    }
  }

  /**
   * Restore Collection from Redis
   * @param key string
   * @returns UserCollection
   */
  async getCollectionFromRedis(key: string): Promise<UserCollection> {
    return this.userCollectionRepository.get(key);
  }

  /**
   * Save collection in Redis
   * @param userColl UserCollection
   * @param expire number
   */
  async saveCollectionRedis(userColl: UserCollection, expire: number) {
    await this.userCollectionRepository.set(userColl.id!, userColl);
    await this.userCollectionRepository.expire(userColl.id!, expire);
  }

  /**
   * Returns if the filter contains collections for the specified search criteria
   * @param criteria SearchCriteria
   * @param filter SearchFilter
   * @returns boolean
   */
  searchByCriteria(criteria: SearchCriteria, filter: SearchFilter): boolean {
    switch (criteria) {
      case 'ADDRESS':
        if (filter.collectionA && filter.collectionA?.length > 0) return true;
        break;
      case 'SLUG':
        if (filter.collectionS && filter.collectionS?.length > 0) return true;
        break;
      default:
        break;
    }
    return false;
  }

  /**
   * Add addresses to collections with slugs.
   * Some collections have only slug, but the address
   * is needed to search, for example, through Moralis.
   * The address is searched through the OpenSea API and
   * the complete collection is returned.
   * @param requestedColls string[] requested collections
   * @returns Promise<string[]>
   */
  async addAddressToSlugCollections(
    requestedColls: string[],
  ): Promise<string[]> {
    const completeColl: string[] = [];

    for (const slug of requestedColls!) {
      try {
        const apiResponse = await this.openseaApiService.getCollectionInfo(
          slug,
        );
        if (
          apiResponse.collection.primary_asset_contracts &&
          apiResponse.collection.primary_asset_contracts.length > 0
        ) {
          const address =
            apiResponse.collection.primary_asset_contracts[0].address ?? null;
          if (address) completeColl.push([slug, address].join(':'));
        }
      } catch (error) {
        this.logger.error(
          `Error getting collection: ${slug} , ${error.message}`,
          {
            controller: 'nft.ctrl',
            method: `addAddressToSlugCollections()`,
          },
        );
      }
    }
    return completeColl;
  }
}
