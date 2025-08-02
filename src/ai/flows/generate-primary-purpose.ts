'use server';

/**
 * @fileOverview A flow to generate a primary purpose statement for a business registration.
 *
 * - generatePrimaryPurpose - A function that generates the primary purpose.
 */

import { ai } from '@/ai/genkit';
import {
    GeneratePrimaryPurposeInputSchema,
    type GeneratePrimaryPurposeInput,
    GeneratePrimaryPurposeOutputSchema,
    type GeneratePrimaryPurposeOutput
} from '@/lib/schemas';


export async function generatePrimaryPurpose(input: GeneratePrimaryPurposeInput): Promise<GeneratePrimaryPurposeOutput> {
    return generatePrimaryPurposeFlow(input);
}


const generatePrimaryPurposePrompt = ai.definePrompt({
    name: 'generatePrimaryPurposePrompt',
    input: { schema: GeneratePrimaryPurposeInputSchema },
    output: { schema: GeneratePrimaryPurposeOutputSchema },
    prompt: `You are an expert in business registration in the Philippines. Based on the provided industry description, generate a formal "Primary Purpose" statement for a corporation. This statement should be suitable for legal documents and align with the Philippine Standard Industrial Classification (PSIC).

Industry Description: {{{industryDescription}}}

Generate a primary purpose statement that is concise, clear, and accurately reflects the core business activities.`,
});


const generatePrimaryPurposeFlow = ai.defineFlow(
    {
        name: 'generatePrimaryPurposeFlow',
        inputSchema: GeneratePrimaryPurposeInputSchema,
        outputSchema: GeneratePrimaryPurposeOutputSchema,
    },
    async (input) => {
        const { output } = await generatePrimaryPurposePrompt(input);
        return output!;
    }
);
