import {inject} from '@loopback/core';
import {RestBindings, get, response, Response} from '@loopback/rest';

/**
 * A simple controller to health status
 */
export class HealthController {
  constructor(@inject(RestBindings.Http.RESPONSE) private res: Response) {}

  // Map to `GET /health`
  @get('/health')
  @response(200)
  health(): void {
    this.res.status(200).end();
  }
}
