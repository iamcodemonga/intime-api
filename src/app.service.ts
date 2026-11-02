import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Intime API';
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'intime-api',
      timestamp: new Date().toISOString(),
    };
  }
}
