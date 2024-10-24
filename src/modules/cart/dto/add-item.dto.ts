import { ServiceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { ItemOptionDto } from './item-option.dto';

export class AddItemDto {
  @IsString()
  serviceId: string;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

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

  @IsNumber()
  @Min(0)
  totalCurrentPrice: number;

  @IsNumber()
  @Min(0)
  totalBasePrice: number;

  @ValidateNested({ each: true })
  @Type(() => ItemOptionDto)
  cartItemOptions: ItemOptionDto[];
}
