import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SanityClient } from '@sanity/client';

@Injectable()
export class SanityService {
  private client: SanityClient;

  constructor(private configService: ConfigService) {
    this.client = createClient({
      projectId: configService.get('SANITY_PROJECT_ID'),
      dataset: configService.get('SANITY_DATASET'),
      apiVersion: configService.get('SANITY_API_VERSION'),
      useCdn: true,
    });
  }

  async fetchData(query: string, params = {}) {
    return await this.client.fetch(query, params);
  }
}
