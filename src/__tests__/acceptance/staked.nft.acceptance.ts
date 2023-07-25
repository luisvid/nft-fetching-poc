import {Client, expect} from '@loopback/testlab';
import {ExternalNftServiceApplication} from '../..';
import {
  stakedNftObj1,
  stakedNftObj2,
  stakedNftObj3,
  updateObj2,
  updateObj3,
} from './test-filter-objects';
import {setupApplication} from './test-helper';

describe('StakedNFTs', () => {
  let app: ExternalNftServiceApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  after(async () => {
    await app.stop();
  });

  // to compare the execution times between the call with useCache=false
  // and useCache=true, run the tests with the --slow 0 option
  // yarn test --slow 0
  // to run tests from this file only
  // yarn test --slow 0 --g 'StakedNFTs'

  const testCollections = [
    'MAGICEDEN:SOLANA:catchking_explorers',
    'MAGICEDEN:SOLANA:jambo_mambo',
  ];

  it('invokes GET /collections, expect to add test collections to inmemory DB ', async () => {
    for (const coll of testCollections) {
      const [marketplace, network, collectionId] = coll.split(':');
      const res = await client
        .get(
          `/collections/marketplace/${marketplace}/network/${network}/id/${collectionId}/info?useCache=false`,
        )
        .expect(200);
      expect(res.body).to.containEql({id: [network, collectionId].join(':')});
    }
  }).timeout(10000);

  it('invokes PATCH /collections/{id}, expect to fail validating staked data from endpoint', async () => {
    const res = await client
      .patch('/collections/SOLANA:catchking_explorers')
      .send(updateObj3)
      .expect(200);
    expect(res.body).to.containEql({success: false});
    expect(res.body).to.containEql({errorMessage: 'Invalid data schema'});
  }).timeout(30000);

  it('invokes PATCH /collections/{id}, expect to update mock staked data in collection', async () => {
    const res = await client
      .patch('/collections/SOLANA:catchking_explorers')
      .send(updateObj2)
      .expect(200);
    expect(res.body).to.containEql({success: true});
  }).timeout(30000);

  it('invokes POST /nft-access, expect validate that the wallet has NFTs in staking', async () => {
    const res = await client
      .post('/nft-access')
      .send(stakedNftObj1)
      .expect(200);
    expect(res.body).to.containEql({success: true});
  }).timeout(30000);

  it('invokes POST /nft-access, expect validate with staked data saved in cache from previous test', async () => {
    const res = await client
      .post('/nft-access')
      .send(stakedNftObj2)
      .expect(200);
    expect(res.body).to.containEql({success: true});
  }).timeout(30000);

  it('invokes POST /nft-access, expect negative validation, the wallet does not have any NFT from collection', async () => {
    const res = await client
      .post('/nft-access')
      .send(stakedNftObj3)
      .expect(200);
    expect(res.body).to.containEql({success: false});
  }).timeout(30000);

  it('invokes POST /nfts, expect 1 collection with 2 NFTs in staking', async () => {
    const res = await client.post('/nfts').send(stakedNftObj1).expect(200);
    expect(res.body).to.containEql({success: true});
    expect(res.body.data.length).to.equal(1);
    expect(res.body.data[0].userNfts.length).to.equal(2);
  }).timeout(30000);
});
