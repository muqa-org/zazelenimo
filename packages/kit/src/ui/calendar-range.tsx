import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { PropsWithChildren } from 'react';
import { ControllerRenderProps, FieldPath, FieldValues } from 'react-hook-form';

import { Button, FormControl } from '..';
import { Calendar } from './calendar';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { cn } from '../lib/utils';

export function RangeCalendar<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  children,
  field,
}: PropsWithChildren<{ field: ControllerRenderProps<TFieldValues, TName> }>) {
  console.log('field', field);
  const { value, onChange } = field;
  const { from, to } = value ?? { from: null, to: null };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant={'outline'}
            className={cn(
              'pl-3 text-left font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            {value ? formatDateRange({ from, to }) : children}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
function formatDateRange({ from, to }: { from: Date | null; to: Date | null }) {
  return from && `${format(from, 'PPP')}${to ? ` - ${format(to, 'PPP')}` : ''}`;
}
