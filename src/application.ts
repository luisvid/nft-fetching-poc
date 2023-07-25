import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import moment from 'moment';
import path from 'path';
import {LogConfig} from './environment/environment';
import {MySequence} from './sequence';
//Winston Import
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

//define custom format for logs
const customFormat = winston.format.combine(
  winston.format.splat(),
  winston.format.simple(),
  winston.format.colorize(),
  winston.format.align(),
  winston.format.printf(
    info =>
      `${moment().format('YYYY-MM-DD HH:mm:ss:SS')} - ${info.level}: [${
        info.service
      } ${info.controller} ${info.endpoint} ${info.method}]${info.message} -- ${
        info.filter ? ` ${JSON.stringify(info.filter)}` : ''
      }--`,
  ),
);

//logger for the acct-statdates
winston.loggers.add(LogConfig.logName, {
  exitOnError: false,
  format: winston.format.combine(customFormat),
  defaultMeta: {
    service: 'nft-service',
    controller: '',
    endpoint: '',
    method: '',
    filter: '',
  },
  transports: [
    new DailyRotateFile({
      filename: LogConfig.logDirectory + LogConfig.logFileWarning,
      datePattern: LogConfig.logDatePattern,
      zippedArchive: true,
      level: 'info',
    }),
    new DailyRotateFile({
      filename: LogConfig.logDirectory + LogConfig.logFileIssue,
      datePattern: LogConfig.logDatePattern,
      zippedArchive: true,
      level: 'warn',
    }),
    new winston.transports.Console({
      level: 'info',
    }),
  ],
});

export {ApplicationConfig};

export class ExternalNftServiceApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
