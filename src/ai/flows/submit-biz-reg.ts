
'use server';

/**
 * @fileOverview A flow to submit business registration data to a Google Sheet.
 * 
 * - submitBizReg - A function that submits the business registration data.
 * - BizRegFormDataSchema - The Zod schema for the business registration form data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { bizRegFormSchema, type BizRegFormValues } from '@/lib/schemas';
import { appendToSheet } from '@/services/google-sheets';

export async function submitBizReg(data: BizRegFormValues): Promise<{success: boolean; message: string}> {
  return submitBizRegFlow(data);
}

const submitBizRegFlow = ai.defineFlow(
  {
    name: 'submitBizRegFlow',
    inputSchema: bizRegFormSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (data) => {
    try {
      const parsedData = bizRegFormSchema.parse(data);
      await appendToSheet(parsedData);
      return { success: true, message: 'Data submitted successfully.' };
    } catch (error) {
      console.error('Error submitting to Google Sheet:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { success: false, message: `Failed to submit data: ${errorMessage}` };
    }
  }
);
