import { ServiceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { ItemOptionDto } from './item-option.dto';

export class UpdateItemDto {
  @IsString()
  serviceId: string;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

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

  @IsNumber()
  @Min(0)
  totalBasePrice: number;

  @IsNumber()
  @Min(0)
  totalCurrentPrice: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemOptionDto)
  cartItemOptions: ItemOptionDto[];
}
