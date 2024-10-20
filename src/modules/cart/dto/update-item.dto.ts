import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { UpdateItemOptionDto } from './update-item-option.dto';

export class UpdateItemDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateItemOptionDto)
  options: UpdateItemOptionDto[];
}
