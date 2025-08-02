
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TinInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
}

const formatTin = (tin: string): string => {
  const digitsOnly = tin.replace(/\D/g, '').substring(0, 9);
  if (digitsOnly.length === 0) return '';
  
  const parts = [];
  if (digitsOnly.length > 0) parts.push(digitsOnly.substring(0, 3));
  if (digitsOnly.length > 3) parts.push(digitsOnly.substring(3, 6));
  if (digitsOnly.length > 6) parts.push(digitsOnly.substring(6, 9));
  
  return parts.join('-');
};

export function TinInput({ value, onChange, ...props }: TinInputProps) {
  const [displayValue, setDisplayValue] = React.useState(formatTin(value));

  React.useEffect(() => {
    // Only reformat if the value from the form doesn't already have dashes
    if (!/^\d{3}-\d{3}-\d{3}$/.test(value)) {
      setDisplayValue(formatTin(value));
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatTin(e.target.value);
    setDisplayValue(formattedValue);
    onChange(formattedValue);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      className={cn(props.className)}
      {...props}
    />
  );
}
