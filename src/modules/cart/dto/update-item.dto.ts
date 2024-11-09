import { ServiceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ItemOptionDto } from './item-option.dto';

export class UpdateItemDto {
  @IsString()
  service_id: string;

  @IsEnum(ServiceType)
  service_type: ServiceType;

  @IsDateString()
  @Type(() => Date)
  date: Date;

  @IsString()
  time: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  image_src?: string;

  @IsOptional()
  @IsString()
  image_lqip?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemOptionDto)
  cart_item_options: ItemOptionDto[];
}
