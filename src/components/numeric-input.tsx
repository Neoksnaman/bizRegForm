
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumericInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: number | string;
  onChange: (value: number) => void;
  prefix?: string;
}

// Function to format the number with commas
const formatNumber = (num: number | string): string => {
  if (num === null || num === undefined || num === '') return '';
  const stringValue = String(num).replace(/,/g, '');
  const numberValue = parseFloat(stringValue);
  if (isNaN(numberValue)) return '';
  return numberValue.toLocaleString('en-US');
};

// Function to parse the formatted string back to a number
const parseNumber = (str: string): number => {
  const cleanedString = String(str).replace(/,/g, '');
  return parseFloat(cleanedString) || 0;
};


export function NumericInput({ value, onChange, prefix, className, ...props }: NumericInputProps) {
  const [displayValue, setDisplayValue] = React.useState(formatNumber(value));

  React.useEffect(() => {
    setDisplayValue(formatNumber(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/[^0-9.]/g, '');
    setDisplayValue(formatNumber(numericValue));
    onChange(parseNumber(numericValue));
  };
  
  const handleBlur = () => {
    const numericValue = parseNumber(displayValue);
    setDisplayValue(formatNumber(numericValue));
    onChange(numericValue);
  };


  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {prefix}
        </span>
      )}
      <Input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(prefix ? "pl-8" : "", className)}
        {...props}
      />
    </div>
  );
}

    