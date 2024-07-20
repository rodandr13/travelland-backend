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

  async getExcursionPrices(id: string) {
    // 7d667969-dfcd-42a5-836b-cc25319508ab
    const query = `
    *[_id == $id]{
   "basePrices": prices[]{price, "id": category->{_id}._id, "title":category->{title[_key == "ru"]}.title[0].value, "description":category->{description[_key == "ru"]}.description[0].value},
  "promotionalPrices": promotionalPrices[]{weekdays, title, dates, "prices": prices[]{price, "title":category->{title[_key == "ru"]}.title[0].value, "description":category->{description[_key == "ru"]}.description[0].value}}[dates.dateFrom <= now() && dates.dateTo >= now()],
  "priceCorrections": priceCorrections[]{weekdays, title, dates, "prices": prices[]{price, "title":category->{title[_key == "ru"]}.title[0].value, "description":category->{description[_key == "ru"]}.description[0].value}}[dates.dateFrom <= now() && dates.dateTo >= now()],
}[0]`;

    const {basePrices, promotionalPrices, priceCorrections} = await this.client.fetch(query, { id: id });
    console.log(basePrices, promotionalPrices, priceCorrections)
    return 'prices';
  }
}
