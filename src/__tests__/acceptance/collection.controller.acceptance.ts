import {Client, expect} from '@loopback/testlab';
import {ExternalNftServiceApplication} from '../..';
import {setupApplication} from './test-helper';

describe('CollectionController', () => {
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
  // yarn test --slow 0 --g 'CollectionController'

  // Test data
  const market = 'RARIBLE';
  const network = 'IMMUTABLEX';
  const collId = '0xacb3c6a43d15b907e8433077b6d38ae40936fe2c';
  const wrongCollId = '0xacb3c6a43d15b907e8433077b6d38ae40936fe2x';

  it('invokes GET /collections forcing to refetch data, expect to get the requested collection', async () => {
    const res = await client
      .get(
        `/collections/marketplace/${market}/network/${network}/id/${collId}/info?useCache=false`,
      )
      .expect(200);
    expect(res.body).to.containEql({id: [network, collId].join(':')});
  }).timeout(5000);

  it('invokes GET /collections, expect to get the requested collection from cache', async () => {
    const res = await client
      .get(
        `/collections/marketplace/${market}/network/${network}/id/${collId}/info?useCache=true`,
      )
      .expect(200);
    expect(res.body).to.containEql({id: [network, collId].join(':')});
  }).timeout(5000);

  it('invokes GET /collections with a non-existent collection, expect an error code', async () => {
    const res = await client
      .get(
        `/collections/marketplace/${market}/network/${network}/id/${wrongCollId}/info?useCache=true`,
      )
      .expect(200);
    expect(res.body).to.containEql({errorCode: 'COLLECTION_NOT_FOUND'});
  }).timeout(5000);

  it('invokes GET /collections to add 4 test collections to inmemory DB ', async () => {
    const testCollections = [
      'MAGICEDEN:SOLANA:jambo_mambo',
      'OPENSEA:ETHEREUM:tropical-turtles',
      'OPENSEA:BINANCE:monstropoly-monsters',
      'RARIBLE:IMMUTABLEX:0xa1c59514b703ba8c6479d05405fba6390515cfc8',
    ];
    for (const coll of testCollections) {
      const [mkt, net, collectionId] = coll.split(':');
      const res = await client
        .get(
          `/collections/marketplace/${mkt}/network/${net}/id/${collectionId}/info?useCache=false`,
        )
        .expect(200);
      expect(res.body).to.containEql({id: [net, collectionId].join(':')});
    }
  }).timeout(5000);

  it('invokes POST /collections/info: expect info for 5 collections', async () => {
    const CollectionFilter = {
      collectionIds: [
        'SOLANA:jambo_mambo',
        'ETHEREUM:tropical-turtles',
        'BINANCE:monstropoly-monsters',
        'IMMUTABLEX:0xacb3c6a43d15b907e8433077b6d38ae40936fe2c',
        'IMMUTABLEX:0xa1c59514b703ba8c6479d05405fba6390515cfc8',
      ],
    };
    const res = await client
      .post('/collections/info')
      .send(CollectionFilter)
      .expect(200);
    expect(res.body).to.containEql({success: true});
    expect(res.body.collections.length).to.equal(5);
  }).timeout(5000);
});
