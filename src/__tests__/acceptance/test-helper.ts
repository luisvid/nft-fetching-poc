import {
  Client,
  createRestAppClient,
  givenHttpServerConfig,
} from '@loopback/testlab';
import {ExternalNftServiceApplication} from '../..';
export async function setupApplication(): Promise<AppWithClient> {
  const restConfig = givenHttpServerConfig({
    // Customize the server configuration here.
    // Empty values (undefined, '') will be ignored by the helper.
    port: +(process.env.PORT ?? 3000),
    host: process.env.HOST,
    gracePeriodForClose: 5000,
  });

  const app = new ExternalNftServiceApplication({
    rest: restConfig,
  });
  // create a dynamic inmemory DB for main DB (Mongo)
  app.bind('datasources.config.externalnft').to({
    name: 'externalnft',
    connector: 'memory',
  });

  // create a dynamic inmemory DB for cache (Redis)
  app.bind('datasources.config.redis').to({
    name: 'redis',
    connector: 'kv-memory',
  });

  await app.boot();
  await app.start();

  const client = createRestAppClient(app);

  return {app, client};
}

export interface AppWithClient {
  app: ExternalNftServiceApplication;
  client: Client;
}
