import {/* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository, WhereBuilder} from '@loopback/repository';
import * as joi from 'joi';
import fetch from 'node-fetch';
import winston from 'winston';
import {addMilliseconds, envNumberOrDefault} from '../enums/helpers';
import {LogConfig} from '../environment/environment';
import {CollectionRepository} from '../repositories';

const STAKED_DATA_EXPIRATION = envNumberOrDefault(
  'STAKED_DATA_EXPIRATION_ML',
  30000,
);

@injectable({scope: BindingScope.TRANSIENT})
export class StakedNftsService {
  public logger = winston.loggers.get(LogConfig.logName);

  constructor(
    /* Add @inject to inject parameters */
    @repository(CollectionRepository)
    protected collectionRepository: CollectionRepository,
  ) {}

  /**
   * returns staked NFTs belonging to the wallet in the specified collections
   *
   * @param wallet string
   * @param network string
   * @param requestedColls string[] requested collections
   * @returns Promise<string[]>
   */
  async getStakedNfts(
    wallet: string,
    network: string,
    requestedColls: string[],
  ): Promise<string[]> {
    const stakedNfts: string[] = [];
    try {
      requestedColls = requestedColls.map(col => network + ':' + col);
      // finds requested collections that have a staked nfts endpoint
      const where = new WhereBuilder()
        .inq('id', requestedColls)
        .and({stakedNftsEndpoint: {neq: null}})
        .build();

      const dbCollection = await this.collectionRepository.find({
        where: where,
      });

      // For collections that have staked NFTs endpoint:
      for (const coll of dbCollection) {
        if (coll.stakedNftsEndpoint) {
          const dateNow = new Date();
          const dateEndStaking = addMilliseconds(
            coll.stakedTimestamp ? coll.stakedTimestamp : '0',
            STAKED_DATA_EXPIRATION,
          );
          // check if the data cache time expired
          if (dateNow > dateEndStaking) {
            // get staked data and update collection
            const response = await fetch(coll.stakedNftsEndpoint!);
            coll.stakedData = await response.json();
            coll.stakedTimestamp = dateNow.toJSON();
            await this.collectionRepository.update(coll);
          }
        }
        if (coll.stakedData) {
          // look for the wallet in the list of staked NFTs.
          const walletStaked = coll.stakedData![wallet as keyof object];
          if (walletStaked) {
            // add the NFTs found in the collection to the return array
            const values = Object.values(walletStaked);
            stakedNfts.push(...(values as unknown as string));
          }
        }
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'staked-nfts.service',
        method: `getStakedNfts(${wallet},${network}, ${requestedColls})`,
      });
    }
    return Array.from(new Set(stakedNfts));
  }

  /**
   * Returns the address of the wallet that contains the NFT, in staking
   *
   * @param collectionId string
   * @param tokenId string NFT mintAddress or tokenId
   * @returns Promise<string>
   */
  async getStakedOwner(collectionId: string, tokenId: string): Promise<string> {
    let stakedOwner = '';
    try {
      // check if the requested collection that have a staked nfts endpoint
      const dbCollection = await this.collectionRepository.findById(
        collectionId,
      );

      if (dbCollection.stakedNftsEndpoint) {
        // check if the data cache expired and update staked data
        const dateNow = new Date();
        const dateEndStaking = addMilliseconds(
          dbCollection.stakedTimestamp ? dbCollection.stakedTimestamp : '0',
          STAKED_DATA_EXPIRATION,
        );
        if (dateNow > dateEndStaking) {
          const response = await fetch(dbCollection.stakedNftsEndpoint!);
          dbCollection.stakedData = await response.json();
          dbCollection.stakedTimestamp = dateNow.toJSON();
          await this.collectionRepository.update(dbCollection);
        }
        if (dbCollection.stakedData) {
          Object.entries(dbCollection.stakedData).find(([key, value]) => {
            const found = value.find((element: string) => element === tokenId);
            if (found) {
              stakedOwner = key;
              return true;
            }
            return false;
          });
        }
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'staked-nfts.service',
        method: `getStakedOwner(${collectionId},${tokenId})`,
      });
    }
    return stakedOwner;
  }

  /**
   * Validates that the new staked endpoint is correct
   * and returns the expect data format
   *
   * @param newStakedEndpoint string
   * @returns Promise<string>
   */
  async validateStakedEndpoint(newStakedEndpoint: string): Promise<string> {
    try {
      const response = await fetch(newStakedEndpoint);
      const stakedData = await response.json();

      const schema = joi
        .object()
        .pattern(joi.string(), joi.array().items(joi.string()));
      const result = schema.validate(stakedData);

      if (result.error) {
        console.error(
          'Error validateStakedEndpoint(): %s ',
          result.error.details[0].message,
        );
        return 'Invalid data schema';
      }
    } catch (error) {
      this.logger.error(error.message, {
        controller: 'staked-nfts.service',
        method: `validateStakedEndpoint(${newStakedEndpoint})`,
      });
      return 'Invalid endpoint URI';
    }
    return 'OK';
  }
}
