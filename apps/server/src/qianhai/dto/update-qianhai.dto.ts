import { PartialType } from '@nestjs/mapped-types';
import { CreateQianhaiDto } from './create-qianhai.dto';

export class UpdateQianhaiDto extends PartialType(CreateQianhaiDto) {}
