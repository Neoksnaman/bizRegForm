
"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { BizRegFormValues } from "@/lib/schemas";

type AddressFieldsProps = {
  form: UseFormReturn<BizRegFormValues>;
  baseFieldName: `principalOfficeAddress` | `incorporators.${number}.residence`;
};

export function AddressFields({ form, baseFieldName }: AddressFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`${baseFieldName}.street`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>No. / Street</FormLabel>
            <FormControl>
              <Input placeholder="e.g., 123 Rizal Avenue" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${baseFieldName}.barangay`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barangay</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Santa Cruz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${baseFieldName}.city`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>City / Town</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Manila" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${baseFieldName}.province`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Province</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Metro Manila" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${baseFieldName}.zipCode`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zip Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 1003" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
