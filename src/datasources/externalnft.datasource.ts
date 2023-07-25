import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const dbUrl = process.env.DB_URL;

const config = {
  name: 'externalnft',
  connector: 'mongodb',
  url: dbUrl,
  host: '',
  port: 0,
  user: '',
  password: '',
  database: '',
  useNewUrlParser: true,
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class ExternalnftDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'externalnft';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.externalnft', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
