import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isAfter, parseISO, startOfDay } from 'date-fns';

@ValidatorConstraint({ async: false })
export class IsActualDateConstraint implements ValidatorConstraintInterface {
  validate(dateStr: string) {
    const date = parseISO(dateStr);
    const today = startOfDay(new Date());
    return isAfter(date, today) || date.getTime() === today.getTime();
  }

  defaultMessage(): string {
    return 'Дата должна быть не прошедшей';
  }
}

export const IsActualDate = (validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsActualDateConstraint,
    });
  };
};
