import { ServiceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';

import { AddItemOptionDto } from './add-item-option.dto';

export class AddItemDto {
  @IsString()
  serviceId: string;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsDateString()
  date: string;

  @IsString()
  time: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddItemOptionDto)
  options: AddItemOptionDto[];
}
