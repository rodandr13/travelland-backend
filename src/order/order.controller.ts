import { Controller, Get } from '@nestjs/common';

import { SanityService } from '../external/sanity/sanity.service';

@Controller('order')
export class OrderController {
  constructor(private readonly sanityService: SanityService) {}

  @Get()
  async create() {
    const query = `*[_type == "excursion"][0]`;
    const excursion = await this.sanityService.fetchData(query);
    return excursion;
  }
}
