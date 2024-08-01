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

  async getExcursionPrices(id: string, date: string) {
    const query = `
    *[_id == $id]{
    "basePrices": prices[]{price, "id": category->{_id}._id, "title":category->{title[_key == "ru"]}.title[0].value, "description":category->{description[_key == "ru"]}.description[0].value},
  "promotionalPrices": promotionalPrices[]{weekdays, title, dates, "prices": prices[]{ "id": category->{_id}._id, price, "title":category->{title[_key == "ru"]}.title[0].value, "description":category->{description[_key == "ru"]}.description[0].value}}[dates.dateFrom <= now() && dates.dateTo >= now() && $date >= dates.dateFrom && $date <= dates.dateTo],
  "priceCorrections": priceCorrections[]{weekdays, title, dates, "prices": prices[]{ "id": category->{_id}._id, price, "title":category->{title[_key == "ru"]}.title[0].value, "description":category->{description[_key == "ru"]}.description[0].value}}[dates.dateFrom <= now() && dates.dateTo >= now() && $date >= dates.dateFrom && $date <= dates.dateTo],
}[0]`;
    const params = { id: id, date: date };
    const {
      basePrices: prices,
      promotionalPrices,
      priceCorrections,
    } = await this.fetchData(query, params);

    const basePrices = prices.map(({ price, id }) => ({
      categoryId: id,
      price,
    }));
    const currentPrices = [];

    const findPrice = (categoryId, pricesArray) => {
      for (const price of pricesArray) {
        if (price.id === categoryId) {
          return price;
        }
      }

      return null;
    };

    const getDayOfWeek = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { weekday: 'long' });
    };

    for (const basePrice of basePrices) {
      const categoryId = basePrice.categoryId;

      let currentPrice = null;
      for (const promo of promotionalPrices) {
        const isDayIncluded = promo.weekdays.includes(getDayOfWeek(date));
        if (!isDayIncluded) continue;
        currentPrice = findPrice(categoryId, promo.prices);
        if (currentPrice) break;
      }

      if (!currentPrice) {
        for (const correction of priceCorrections) {
          const isDayIncluded = correction.weekdays.includes(
            getDayOfWeek(date),
          );
          if (!isDayIncluded) continue;
          currentPrice = findPrice(categoryId, correction.prices);
          if (currentPrice) break;
        }
      }

      if (!currentPrice) {
        currentPrice = basePrice;
      }

      currentPrices.push({
        categoryId: categoryId,
        price: currentPrice.price,
      });
    }

    return {
      basePrices,
      currentPrices,
    };
  }
}
