import { ServiceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ItemOptionDto } from './item-option.dto';

export class AddItemDto {
  @IsString()
  service_id: string;

  @IsEnum(ServiceType)
  service_type: ServiceType;

  @IsDateString()
  date: Date;

  @IsString()
  time: string;

  @IsString()
  title: string;

  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  image_src?: string;

  @IsOptional()
  @IsString()
  image_lqip?: string;

  @ValidateNested({ each: true })
  @Type(() => ItemOptionDto)
  cart_item_options: ItemOptionDto[];
}
