import {Client, expect} from '@loopback/testlab';
import {ExternalNftServiceApplication} from '../..';
import {
  filterObj1,
  filterObj11,
  filterObj2,
  filterObj3,
  filterObj4,
  filterObj5,
  filterObj6,
  wrongFilterObj1,
  wrongFilterObj2,
} from './test-filter-objects';
import {setupApplication} from './test-helper';

describe('NftsController', () => {
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
  // yarn test --slow 0 --g 'NftsController'

  const testCollections = [
    'MAGICEDEN:SOLANA:jambo_mambo',
    'OPENSEA:ETHEREUM:bongbears',
    'OPENSEA:POLYGON:rocket-monsters-universe-bear-battalion',
    'OPENSEA:POLYGON:rocket-monsters-star-fighter-polygon',
    'OPENSEA:BINANCE:monstropoly-monsters',
    'OPENSEA:ARBITRUM:arbitrum-genesis-nft',
    'RARIBLE:IMMUTABLEX:0xa1c59514b703ba8c6479d05405fba6390515cfc8',
    'RARIBLE:POLYGON:0x2953399124f0cbb46d2cbacd8a89cf0599974963',
    'RARIBLE:POLYGON:0x2ebc03d00c962626d3cd1f5355836da624796efc',
  ];

  it('invokes GET /collections to add test collections to inmemory DB ', async () => {
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

  it('invokes POST /nfts: expect to be grouped in 2 collections 1:eth, 1:solana', async () => {
    const res = await client.post('/nfts').send(filterObj1).expect(200);
    expect(res.body).to.containEql({success: true});
    expect(res.body.data.length).to.equal(2);
  }).timeout(30000);

  it('invokes POST /nfts: expect to get the previous requested collection from cache', async () => {
    const res = await client.post('/nfts').send(filterObj1).expect(200);
    expect(res.body).to.containEql({success: true});
    expect(res.body.data.length).to.equal(2);
  }).timeout(30000);

  it('invokes POST /nfts: expect to re-fetch the previous requested collection', async () => {
    const res = await client.post('/nfts').send(filterObj11).expect(200);
    expect(res.body).to.containEql({success: true});
    expect(res.body.data.length).to.equal(2);
  }).timeout(30000);

  it('invokes POST /nfts: expect to get 3 collections 2:polygon, 1:solana', async () => {
    const res = await client.post('/nfts').send(filterObj2).expect(200);
    expect(res.body).to.containEql({success: true});
    expect(res.body.data.length).to.equal(3);
  }).timeout(30000);

  it('invokes POST /nfts: expect to get 2 collections 1:imx, 1:polygon', async () => {
    const res = await client.post('/nfts').send(filterObj3).expect(200);
    expect(res.body).to.containEql({success: true});
    expect(res.body.data.length).to.equal(2);
  }).timeout(30000);

  // A collection not requested in filterObj3 (previous test) should be cached.
  // Calling this object should return all collections from the cache
  it('invokes POST /nfts: expect to get 3 collection from cache 1:imx, 2:polygon', async () => {
    const res = await client.post('/nfts').send(filterObj4).expect(200);
    expect(res.body).to.containEql({success: true});
    expect(res.body.data.length).to.equal(3);
  }).timeout(30000);

  it('invokes POST /nfts: expect to get 2 collections 1:binance, 1:arbitrum', async () => {
    const res = await client.post('/nfts').send(filterObj5).expect(200);
    expect(res.body).to.containEql({success: true});
    expect(res.body.data.length).to.equal(2);
  }).timeout(30000);

  it('invokes POST /nfts: with a wrong address for wallet 1, expect only 1 collections', async () => {
    const res = await client.post('/nfts').expect(200).send(wrongFilterObj1);
    expect(res.body).to.containEql({success: true});
    expect(res.body.data.length).to.equal(1);
  }).timeout(30000);

  it('invokes POST /nfts: with a wrong slug for collection 2, expect only 1 collections', async () => {
    const res = await client.post('/nfts').expect(200).send(wrongFilterObj2);
    expect(res.body).to.containEql({success: true});
    expect(res.body.data.length).to.equal(1);
    expect(res.body.data[0].userNfts.length).to.equal(1);
  }).timeout(30000);

  it('invokes POST /nfts: expect to get 2 collections from Polygon not imported before', async () => {
    const res = await client.post('/nfts').send(filterObj6).expect(200);
    expect(res.body).to.containEql({success: true});
    expect(res.body.data.length).to.equal(2);
  }).timeout(30000);
});
