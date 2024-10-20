import { ServiceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ItemOptionDto } from './item-option.dto';

export class UpsertItemDto {
  @IsString()
  serviceId: string;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsDateString()
  date: Date;

  @IsString()
  time: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemOptionDto)
  options: ItemOptionDto[];
}
