/* eslint-disable @typescript-eslint/no-explicit-any */
import {ValidMarketplaces} from './marketplaces';
import {ValidNetworks} from './networks';

export function isValidNetwork(network: string) {
  if (!network) return false;
  return network in ValidNetworks;
}

export function isValidMarketplace(market: string) {
  if (!market) return false;
  return market in ValidMarketplaces;
}

export function getMoralisNetworkCode(network: string) {
  let code: string;
  switch (network) {
    case ValidNetworks.ETHEREUM:
      code = 'eth';
      break;
    case ValidNetworks.POLYGON:
      code = 'polygon';
      break;
    case ValidNetworks.BINANCE:
      code = 'bsc';
      break;
    case ValidNetworks.ARBITRUM:
      code = 'arbitrum';
      break;
    default:
      code = '';
      break;
  }
  return code;
}

export function failResponse(
  errorCode: string,
  errorMessage: string,
  data: any,
) {
  if (!errorCode) {
    throw new Error('failResponse needs errorCode');
  }
  return {
    success: false,
    errorCode,
    errorMessage,
    ...data,
  };
}

export function successResponse(data: any) {
  return {
    success: true,
    ...data,
  };
}

export function accessResponse(access: boolean) {
  return {
    success: access,
  };
}

export function envNumberOrDefault(envVar: string, defaultValue = 0) {
  const value = process.env[envVar];
  return value != null ? parseInt(value) : defaultValue;
}

/**
 * Check if the image URL is an IPFS CID, convert it as and URL to image
 * @param imageUri string
 * @returns string | null
 */
export function checkCID(imageUri: string | undefined): string | null {
  if (imageUri) {
    // TODO: check all cases
    // if (imageUri.includes('ipfs')) {
    //   const ipfData = imageUri.split('/');
    //   const CID = ipfData.pop();
    //   return CID ? `https://ipfs.io/ipfs/${CID}` : null;
    // } else {
    //   return imageUri;
    // }
    return imageUri;
  } else {
    return null;
  }
}

export const SOLANA_REGEX = new RegExp('(^[A-Za-z0-9]{32,44}$)');
export const searchCriterias = ['ADDRESS', 'SLUG'] as const;
export type SearchCriteria = typeof searchCriterias[number];

export function isAddress(addresOrSlug: string): boolean {
  if (addresOrSlug.startsWith('0x')) {
    return true;
  } else {
    if (SOLANA_REGEX.test(addresOrSlug)) {
      return true;
    } else {
      return false;
    }
  }
}

export function addMilliseconds(date: string, milliseconds: number): Date {
  const result = new Date(date);
  result.setMilliseconds(result.getMilliseconds() + milliseconds);
  return result;
}
