import {Client, expect} from '@loopback/testlab';
import {ExternalNftServiceApplication} from '../..';
import {updateObj1} from './test-filter-objects';
import {setupApplication} from './test-helper';

describe('OwnershipController', () => {
  let app: ExternalNftServiceApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  after(async () => {
    await app.stop();
  });

  // to run tests from this file only
  // yarn test --slow 0 --g 'OwnershipController'

  const testCollections = [
    'MAGICEDEN:SOLANA:jambo_mambo',
    'MAGICEDEN:SOLANA:catchking_explorers',
    'OPENSEA:ETHEREUM:tropical-turtles',
    'RARIBLE:IMMUTABLEX:0xacb3c6a43d15b907e8433077b6d38ae40936fe2c',
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

  it('invokes PATCH /collections/{id}, expect to update staked data in collection', async () => {
    const res = await client
      .patch('/collections/SOLANA:catchking_explorers')
      .send(updateObj1)
      .expect(200);
    expect(res.body).to.containEql({success: true});
  }).timeout(5000);

  it('invokes GET /owners token 1330 from tropical-turtles collection', async () => {
    const res = await client
      .get(`/owners/ETHEREUM:tropical-turtles/1330`)
      .expect(200);
    expect(res.body.owners[0]).to.be.equal(
      '0x1298ea1e151d84c4a1629d6bd2813666c1c2f86c',
    );
  }).timeout(5000);

  it('invokes GET /owners mint addres 3cUP2Ho1Tyq2tQXQctKHVUdjocTkC9UsNUc4ByMgiBTn from collection jambo_mambo', async () => {
    const res = await client
      .get(
        `/owners/SOLANA:jambo_mambo/3cUP2Ho1Tyq2tQXQctKHVUdjocTkC9UsNUc4ByMgiBTn`,
      )
      .expect(200);
    expect(res.body.owners[0]).to.be.equal(
      '95HaJZwCvsDNepcKFXFyWRsZD5jPwMzkgFmCMnY2N8xc',
    );
  }).timeout(5000);

  it('invokes GET /owners token 218552151 from collection IMMUTABLEX:0xacb3c6a43d15b907e8433077b6d38ae40936fe2c', async () => {
    const res = await client
      .get(
        `/owners/IMMUTABLEX:0xacb3c6a43d15b907e8433077b6d38ae40936fe2c/218552151`,
      )
      .expect(200);
    expect(res.body.owners[0]).to.be.equal(
      '0xb360d17a4f95711bc1206c11912c432905cdfc13',
    );
  }).timeout(5000);

  it('invokes GET /owners mint address Dj1Mz6NnZw3FhzuJRFmSdngXaa8QuVcA5nkqb8rbe3gY is in staking', async () => {
    const res = await client
      .get(
        `/owners/SOLANA:catchking_explorers/Dj1Mz6NnZw3FhzuJRFmSdngXaa8QuVcA5nkqb8rbe3gY`,
      )
      .expect(200);
    expect(res.body.owners.length).to.equal(2);
    // the second item it's the actual owner
    expect(res.body.owners[1]).to.be.equal(
      '5yPGvUz6JWKjkViGwTCpygJii1rP2xv5yx146ULtBiYq',
    );
  }).timeout(30000);
});
