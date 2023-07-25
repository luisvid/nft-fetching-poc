/**
 * filter object 1
 * looks for
 * 1 ethereum collection by slug
 * 1 solana collections by slug
 * the result will be grouped by collection
 */
export const filterObj1 = {
  userId: 'gamer123',
  limit: 0,
  offset: '',
  useCache: true,
  owner: [
    'ETHEREUM:0x66b19A1241FD54fE74dD8E40B7df8C419492e423',
    'ETHEREUM:0x758e83c114E36a28CA1f31C4d2ADB5Ec7c04C578',
    'SOLANA:G6UCAj7jZr1aX6TmBVZsj1JCpCyXA4L9xfVepy6dAMyG',
    'SOLANA:FEt7YjKTaKm8HWCafhHEt4j1kBgkLgZzKxbESdF6ouWY',
  ],
  collection: ['ETHEREUM:bongbears', 'SOLANA:jambo_mambo'],
};

/**
 * filter object 1-1
 * force re fectch with cache = false
 * looks for
 * 1 ethereum collection by slug
 * 2 solana collections by slug
 */
export const filterObj11 = {
  userId: 'gamer123',
  limit: 0,
  offset: '',
  useCache: false,
  owner: [
    'ETHEREUM:0x66b19A1241FD54fE74dD8E40B7df8C419492e423',
    'ETHEREUM:0x758e83c114E36a28CA1f31C4d2ADB5Ec7c04C578',
    'SOLANA:G6UCAj7jZr1aX6TmBVZsj1JCpCyXA4L9xfVepy6dAMyG',
    'SOLANA:FEt7YjKTaKm8HWCafhHEt4j1kBgkLgZzKxbESdF6ouWY',
  ],
  collection: ['ETHEREUM:bongbears', 'SOLANA:jambo_mambo'],
};

/**
 * filter object 2
 * looks for
 * 2 polygon collection by slug
 * 1 solana collections by slug
 */
export const filterObj2 = {
  userId: 'gamer123',
  limit: 0,
  offset: '',
  useCache: true,
  owner: [
    'POLYGON:0x4174076eEf8F7790C01196BF7eA21eB93f07E254',
    'SOLANA:FEt7YjKTaKm8HWCafhHEt4j1kBgkLgZzKxbESdF6ouWY',
  ],
  collection: [
    'POLYGON:rocket-monsters-universe-bear-battalion',
    'POLYGON:rocket-monsters-star-fighter-polygon',
    'SOLANA:jambo_mambo',
  ],
};

/**
 * filter object3 Rarible collections
 * looks for
 * 1 immutablex collection by address
 * 1 polygon collections by address
 */
export const filterObj3 = {
  userId: 'gamer123',
  limit: 0,
  offset: '',
  useCache: true,
  owner: [
    'IMMUTABLEX:0x19a326b151def3b9a5bc268cc0d298b7a978bcfd',
    'POLYGON:0x3845E01456dc27F12A2205922b332B1A391D4D5b',
  ],
  collection: [
    'IMMUTABLEX:0xa1c59514b703ba8c6479d05405fba6390515cfc8',
    'POLYGON:0x2953399124f0cbb46d2cbacd8a89cf0599974963',
  ],
};

/**
 * filter object3 Rarible collections
 * looks for
 * 1 immutablex collection by address
 * 2 polygon collections by address
 * NOTE: The second collection is not requested in filterObj3, but should be cached.
 * Calling this object should return all collections from the cache
 */
export const filterObj4 = {
  userId: 'gamer123',
  limit: 0,
  offset: '',
  useCache: true,
  owner: [
    'IMMUTABLEX:0x19a326b151def3b9a5bc268cc0d298b7a978bcfd',
    'POLYGON:0x3845E01456dc27F12A2205922b332B1A391D4D5b',
  ],
  collection: [
    'IMMUTABLEX:0xa1c59514b703ba8c6479d05405fba6390515cfc8',
    'POLYGON:0x2953399124f0cbb46d2cbacd8a89cf0599974963',
    'POLYGON:0x2ebc03d00c962626d3cd1f5355836da624796efc',
  ],
};

/**
 * filter object5
 * looks for
 * 1 binance collection by slug
 * 1 arbitrum collections by slug
 * NOTE: the collections are imported from OpenSea
 * but searched through Moralis
 */
export const filterObj5 = {
  userId: 'gamer123',
  limit: 0,
  offset: '',
  useCache: true,
  owner: [
    'BINANCE:0xe55f7cF0B2D7cBB2d257EBcB9cd2BC71561AebDA',
    'ARBITRUM:0x6d07B63D34D0aDFC7e8A08EB86545a5ba3d647A1',
  ],
  collection: ['BINANCE:monstropoly-monsters', 'ARBITRUM:arbitrum-genesis-nft'],
};

/**
 * filter object with error on first owner address
 */
export const wrongFilterObj1 = {
  userId: 'gamer123',
  limit: 0,
  offset: '',
  useCache: true,
  owner: [
    'ETHEREUM:0x66b19A1241FD54fE74dD8E40B7df8C419492e42x',
    'SOLANA:FEt7YjKTaKm8HWCafhHEt4j1kBgkLgZzKxbESdF6ouWY',
  ],
  collection: ['ETHEREUM:bongbears', 'SOLANA:jambo_mambo'],
};

/**
 * filter object with error on 1st collection slug
 */
export const wrongFilterObj2 = {
  userId: 'gamer123',
  limit: 0,
  offset: '',
  useCache: true,
  owner: [
    'ETHEREUM:0x66b19A1241FD54fE74dD8E40B7df8C419492e423',
    'SOLANA:FEt7YjKTaKm8HWCafhHEt4j1kBgkLgZzKxbESdF6ouWY',
  ],
  collection: ['ETHEREUM:bongbears', 'SOLANA:jambo_mambox'],
};

/**
 * update collection with real staked info
 */
export const updateObj1 = {
  stakedNftsEndpoint:
    'https://wallets-staked.azurewebsites.net/api/wallets-staked?code=7Q6w7bMPJBKL6EmJEH9gpfgHlIHyn7JrcadgqgYtRC5SxPNljdBA6g==',
  stakedTimestamp: '2022-12-28',
  stakedData: {},
};

/**
 * update collection with valid mock staked info
 * mocked via quickmocker.com
 */
export const updateObj2 = {
  stakedNftsEndpoint: 'https://2mhx7p13z7.api.quickmocker.com/staked-ok',
  stakedTimestamp: '2022-12-28',
  stakedData: {},
};

/**
 * update collection with invalid mock staked info
 * mocked via quickmocker.com
 */
export const updateObj3 = {
  stakedNftsEndpoint: 'https://2mhx7p13z7.api.quickmocker.com/staked-fail',
  stakedTimestamp: '2022-12-28',
  stakedData: {},
};

/**
 * object to validate NFTAccess
 * the wallet has catchking_explorers NFTs but only in staking
 */
export const stakedNftObj1 = {
  userId: 'gamer123',
  limit: 0,
  offset: '',
  useCache: true,
  owner: ['SOLANA:B2aht6HPNKBDC7B91xn1chZiGnDWfqtBVNvyznFwepXt'],
  collection: ['SOLANA:catchking_explorers', 'SOLANA:jambo_mambo'],
};

/**
 * object to validate NFTAccess
 * another wallet that also has catchking_explorers NFTs only in staking
 */
export const stakedNftObj2 = {
  userId: 'gamer123',
  limit: 0,
  offset: '',
  useCache: true,
  owner: ['SOLANA:24RbP5bwfN7LsKYBe1nVY7pNnP7K1TcsAgzNBUVx9WLS'],
  collection: ['SOLANA:catchking_explorers', 'SOLANA:jambo_mambo'],
};

/**
 * object to validate NFTAccess
 * the wallet does not have any NFT from catchking_explorers
 */
export const stakedNftObj3 = {
  userId: 'gamer123',
  limit: 0,
  offset: '',
  useCache: true,
  owner: ['SOLANA:7fA9gBZ2DJejjjXUHAMDYrXR92TtTsbctuqZPU3MdGK8'],
  collection: ['SOLANA:catchking_explorers', 'SOLANA:jambo_mambo'],
};

/**
 * object to validate NFTAccess
 * access: false
 * the wallet does not have items of psyker or rot_gen
 */
export const nftAccessObj1 = {
  owner: ['SOLANA:2Qr2Bh3Q1gDTnwMy7w5UGdEjA4T46zMuct3pxukEoUEu'],
  collection: ['SOLANA:psyker', 'SOLANA:rot_gen'],
};

/**
 * object to validate NFTAccess
 * access: true
 * the wallet does have items of evio_weapons
 */
export const nftAccessObj2 = {
  owner: ['SOLANA:2Qr2Bh3Q1gDTnwMy7w5UGdEjA4T46zMuct3pxukEoUEu'],
  collection: ['SOLANA:psyker', 'SOLANA:rot_gen', 'SOLANA:evio_weapons'],
};

/**
 * object to validate NFTAccess
 * access: true
 * the user's second wallet does have items from jambo_mambo
 */
export const nftAccessObj3 = {
  owner: [
    'SOLANA:2Qr2Bh3Q1gDTnwMy7w5UGdEjA4T46zMuct3pxukEoUEu',
    'SOLANA:G6UCAj7jZr1aX6TmBVZsj1JCpCyXA4L9xfVepy6dAMyG',
  ],
  collection: ['SOLANA:psyker', 'SOLANA:rot_gen', 'SOLANA:jambo_mambo'],
};

/**
 * Filter object for /nfts
 * get collections and save them in cache
 */
export const nftAccessObj4 = {
  userId: 'gamer123',
  owner: ['SOLANA:2Qr2Bh3Q1gDTnwMy7w5UGdEjA4T46zMuct3pxukEoUEu'],
  collection: ['SOLANA:psyker', 'SOLANA:rot_gen', 'SOLANA:evio_weapons'],
};

/**
 * object to validate NFTAccess
 * access: true
 * Neither of the two collections was imported before.
 * Both collections are from Polygon, you must fill
 * in the address before searching.
 */
export const nftAccessObj5 = {
  owner: ['POLYGON:0xa83B3c3543bca7c501924e8F12a4aF89A832bE4a'],
  collection: ['POLYGON:chronos-travelers', 'POLYGON:chronos-items'],
};

/**
 * object to validate NFTAccess
 * access: true
 * The collection was not imported before and is from Binance,
 * the address must be filled in before searching.
 */
export const nftAccessObj6 = {
  owner: ['BINANCE:0xe55f7cF0B2D7cBB2d257EBcB9cd2BC71561AebDA'],
  collection: ['BINANCE:monstropoly-monsters'],
};

/**
 * filter object 2
 * looks for
 * 2 polygon collection by slug
 * Neither of the two collections was imported before.
 * Both collections are from Polygon, you must fill
 * in the address before searching.
 */
export const filterObj6 = {
  userId: 'gamer123',
  limit: 0,
  offset: '',
  useCache: true,
  owner: ['POLYGON:0xa83B3c3543bca7c501924e8F12a4aF89A832bE4a'],
  collection: ['POLYGON:chronos-travelers', 'POLYGON:chronos-items'],
};
