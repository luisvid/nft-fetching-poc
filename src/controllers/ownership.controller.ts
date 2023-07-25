import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, param} from '@loopback/rest';
import winston from 'winston';
import {ValidNetworks} from '../enums';
import {
  checkCID,
  failResponse,
  getMoralisNetworkCode,
  isAddress,
  isValidNetwork,
} from '../enums/helpers';
import {LogConfig} from '../environment/environment';
import {UserOwnership} from '../models';
import {CollectionRepository, UserCollectionRepository} from '../repositories';
import {
  MoralisApi,
  OpenseaApi,
  RaribleApi,
  SolanaApi,
  StakedNftsService,
} from '../services';

export class OwnershipController {
  public logger = winston.loggers.get(LogConfig.logName);
  constructor(
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
   * Return owners for the token provided
   * @param collectionId network:address/slug of the collection contract
   * @param tokenId The id of the token
   * @returns UserOwnership
   */
  @get('/owners/{collectionId}/{tokenId}')
  async getOwnership(
    @param.path.string('collectionId') collectionId: string,
    @param.path.string('tokenId') tokenId: string,
  ): Promise<UserOwnership | null> {
    const network = collectionId.split(':')[0];
    if (!isValidNetwork(network)) {
      this.logger.warn(`Invalid network value: ${network}`, {
        controller: 'ownership.ctrl',
        endpoint: 'get /owners/{collectionId}/{tokenId}',
      });
      return failResponse(
        'UNSUPPORTED_NETWORK',
        `Invalid network value: ${network}`,
        null,
      );
    }

    try {
      let userOwnership: UserOwnership | null = null;
      switch (network) {
        case ValidNetworks.ETHEREUM:
        case ValidNetworks.POLYGON:
        case ValidNetworks.BINANCE:
        case ValidNetworks.ARBITRUM:
          userOwnership = await this.fetchMoralisOwnership(
            network,
            collectionId,
            tokenId,
          );
          break;

        case ValidNetworks.SOLANA:
          userOwnership = await this.fetchSolanaOwnership(
            collectionId,
            tokenId,
          );
          break;

        case ValidNetworks.IMMUTABLEX:
          userOwnership = await this.fetchRaribleOwnership(
            collectionId,
            tokenId,
          );
          break;

        default:
          this.logger.warn(`Invalid network value: ${network}`, {
            controller: 'ownership.ctrl',
            endpoint: 'get /owners/{collectionId}/{tokenId}',
          });
          return failResponse(
            'UNSUPPORTED_NETWORK',
            `Invalid network: ${network}`,
            null,
          );
          break;
      }

      return userOwnership;
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'ownership.ctrl',
        endpoint: 'get /owners/{collectionId}/{tokenId}',
      });
      return failResponse('NFT_OWNERSHIP_ERROR', error, null);
    }
  }

  /**
   * Fetch owners through Moralis API
   * @param collectionId Address or Slug of the collection contract
   * @param tokenId The id of the token
   * @param network The blockchain to query
   * @returns Promise<UserOwnership | null>
   */
  async fetchMoralisOwnership(
    network: string,
    collectionId: string,
    tokenId: string,
  ): Promise<UserOwnership | null> {
    try {
      let collectionAddress = collectionId.split(':')[1];
      if (!isAddress(collectionAddress)) {
        // in case of slug fetch collection address from cache
        const dbCollection = await this.collectionRepository.findById(
          collectionId,
        );
        collectionAddress = dbCollection.address!;
      }
      const nftOwners = await this.moralisApiService.getNFTTokenIdOwners(
        collectionAddress,
        tokenId,
        getMoralisNetworkCode(network),
      );

      if (nftOwners && nftOwners.result.length > 0) {
        const metadata = JSON.parse(nftOwners.result[0].metadata);
        const retUserOwnership = new UserOwnership({
          collectionId,
          tokenId,
          image: metadata
            ? metadata.image
              ? checkCID(metadata.image)
              : null
            : null,
          owners: [],
        });
        for (const item of nftOwners.result) {
          retUserOwnership.owners.push(item.owner_of);
        }
        // check if the token is staked, add the owner to the response
        const stakedOwner = await this.stakedNftsService.getStakedOwner(
          collectionId,
          tokenId,
        );
        if (stakedOwner) retUserOwnership.owners.push(stakedOwner);
        return retUserOwnership;
      } else {
        return null;
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'ownership.ctrl',
        method: `fetchMoralisOwnership(${network},${collectionId},${tokenId})`,
      });
      return null;
    }
  }

  /**
   * Fetch owners through MagicEden API
   * @param collectionId Slug of the collection contract
   * @param mintAddress The mint address of the token
   * @returns Promise<UserOwnership | null>
   */
  async fetchSolanaOwnership(
    collectionId: string,
    mintAddress: string,
  ): Promise<UserOwnership | null> {
    try {
      const nft = await this.solanaApiService.getTokenByMintAddress(
        mintAddress,
      );

      if (nft.mintAddress) {
        const ownership = new UserOwnership({
          collectionId,
          tokenId: mintAddress,
          image: nft.image ? checkCID(nft.image) : null,
          owners: [nft.owner],
        });
        // check if the token is staked, add the owner to the response
        const stakedOwner = await this.stakedNftsService.getStakedOwner(
          collectionId,
          mintAddress,
        );
        if (stakedOwner) ownership.owners.push(stakedOwner);
        return ownership;
      } else {
        return null;
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'ownership.ctrl',
        method: `fetchSolanaOwnership(${collectionId},${mintAddress})`,
      });
      return null;
    }
  }

  /**
   * Fetch owners through Rarible API
   * @param collectionId Address of the collection contract
   * @param tokenId The id of the token
   * @returns Promise<UserOwnership | null>
   */
  async fetchRaribleOwnership(
    collectionId: string,
    tokenId: string,
  ): Promise<UserOwnership | null> {
    try {
      // Item Id has the format {blockchain}:{token}:{tokenId}
      const nft = await this.raribleApiService.getByItemId(
        [collectionId, tokenId].join(':'),
      );

      if (nft.id) {
        const ownership = new UserOwnership({
          collectionId,
          tokenId,
          image: nft.meta.content[0].url
            ? checkCID(nft.meta.content[0].url)
            : null,
          owners: [nft.lastSale.buyer.split(':')[1]],
        });
        // check if the token is staked, add the owner to the response
        const stakedOwner = await this.stakedNftsService.getStakedOwner(
          collectionId,
          tokenId,
        );
        if (stakedOwner) ownership.owners.push(stakedOwner);
        return ownership;
      } else {
        return null;
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'ownership.ctrl',
        method: `fetchRaribleOwnership(${collectionId},${tokenId})`,
      });

      return null;
    }
  }
}
