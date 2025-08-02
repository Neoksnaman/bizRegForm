'use server';

/**
 * @fileOverview Provides address auto-completion suggestions based on partial input.
 *
 * - addressAutocomplete - A function that returns address suggestions.
 * - AddressAutocompleteInput - The input type for the addressAutocomplete function.
 * - AddressAutocompleteOutput - The return type for the addressAutocomplete function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AddressAutocompleteInputSchema = z.object({
  partialAddress: z
    .string()
    .describe('The partial address to use for autocompletion.'),
});
export type AddressAutocompleteInput = z.infer<typeof AddressAutocompleteInputSchema>;

const AddressAutocompleteOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of address suggestions.'),
});
export type AddressAutocompleteOutput = z.infer<typeof AddressAutocompleteOutputSchema>;

export async function addressAutocomplete(input: AddressAutocompleteInput): Promise<AddressAutocompleteOutput> {
  return addressAutocompleteFlow(input);
}

const addressAutocompletePrompt = ai.definePrompt({
  name: 'addressAutocompletePrompt',
  input: {schema: AddressAutocompleteInputSchema},
  output: {schema: AddressAutocompleteOutputSchema},
  prompt: `You are an address suggestion service. Given a partial address, you will return an array of possible complete addresses.

Partial Address: {{{partialAddress}}}

Suggestions:`,
});

const addressAutocompleteFlow = ai.defineFlow(
  {
    name: 'addressAutocompleteFlow',
    inputSchema: AddressAutocompleteInputSchema,
    outputSchema: AddressAutocompleteOutputSchema,
  },
  async input => {
    const {output} = await addressAutocompletePrompt(input);
    return output!;
  }
);
