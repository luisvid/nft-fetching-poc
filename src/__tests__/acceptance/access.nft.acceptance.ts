import {Client, expect} from '@loopback/testlab';
import {ExternalNftServiceApplication} from '../..';
import {
  nftAccessObj1,
  nftAccessObj2,
  nftAccessObj3,
  nftAccessObj4,
  nftAccessObj5,
  nftAccessObj6,
} from './test-filter-objects';
import {setupApplication} from './test-helper';

describe('NFTAccess', () => {
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
  // yarn test --slow 0 --g 'NFTAccess'

  const testCollections = [
    'MAGICEDEN:SOLANA:psyker',
    'MAGICEDEN:SOLANA:rot_gen',
    'MAGICEDEN:SOLANA:evio_weapons',
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

  it('invokes POST /nft-access, expect user does not hace access', async () => {
    const res = await client
      .post('/nft-access')
      .send(nftAccessObj1)
      .expect(200);
    expect(res.body).to.containEql({success: false});
  }).timeout(30000);

  it('invokes POST /nfts: expect 1 collection with nfts', async () => {
    const res = await client.post('/nfts').send(nftAccessObj4).expect(200);
    expect(res.body).to.containEql({success: true});
    expect(res.body.data.length).to.equal(1);
  }).timeout(30000);

  it('invokes POST /nft-access, expect user does have access, get collections from cache', async () => {
    const res = await client
      .post('/nft-access')
      .send(nftAccessObj2)
      .expect(200);
    expect(res.body).to.containEql({success: true});
  }).timeout(30000);

  it('invokes POST /nft-access, expect user does have access from 2nd wallet not in cache', async () => {
    const res = await client
      .post('/nft-access')
      .send(nftAccessObj3)
      .expect(200);
    expect(res.body).to.containEql({success: true});
  }).timeout(30000);

  it('invokes POST /nft-access, expect user does have access, Polygon collections not imported before', async () => {
    const res = await client
      .post('/nft-access')
      .send(nftAccessObj5)
      .expect(200);
    expect(res.body).to.containEql({success: true});
  }).timeout(30000);

  it('invokes POST /nft-access, expect user does have access, Binance collections not imported before', async () => {
    const res = await client
      .post('/nft-access')
      .send(nftAccessObj6)
      .expect(200);
    expect(res.body).to.containEql({success: true});
  }).timeout(30000);
});
