
import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  barangay: z.string().min(1, 'Barangay is required'),
  city: z.string().min(1, 'City/Town is required'),
  province: z.string().min(1, 'Province is required'),
  zipCode: z.string().regex(/^\d{4}$/, 'Must be a valid 4-digit zip code'),
});

const incorporatorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tin: z.string().regex(/^\d{3}-\d{3}-\d{3}$/, 'TIN must be in the format 000-000-000'),
  nationality: z.string().min(1, 'Nationality is required'),
  residence: addressSchema,
  sharesSubscribed: z.coerce.number().min(1, 'Must subscribe to at least one share'),
  amountSubscribed: z.coerce.number().min(0, 'Cannot be negative'),
  birthdate: z.union([z.date(), z.string().datetime()]).optional(),
  esecureId: z.string().min(1, 'eSecure ID is required'),
});

const phoneValidation = z.string().refine(phone => {
  if (!phone) return true; // Optional fields should not fail if empty
  const isMobile = /^09\d{9}$/.test(phone);
  const isLandline = /^\d{8}$/.test(phone);
  return isMobile || isLandline;
}, 'Must be a valid 11-digit mobile (e.g., 09xxxxxxxxx) or 8-digit landline number.');


export const bizRegFormSchema = z.object({
  corporationNames: z.object({
    name1: z.string().min(1, '1st proposed name is required'),
    name2: z.string().min(1, '2nd proposed name is required'),
    name3: z.string().min(1, '3rd proposed name is required'),
  }).refine(data => {
    const names = [data.name1, data.name2, data.name3].filter(Boolean);
    const uniqueNames = new Set(names.map(name => name!.trim().toLowerCase()));
    return uniqueNames.size === names.length;
  }, {
    message: "Proposed names must be unique.",
    path: ["name1"], 
  }),
  principalOfficeAddress: addressSchema,
  industryDescription: z.string().min(1, 'Industry description is required'),
  primaryPurpose: z.string().min(1, 'Primary purpose is required'),
  secondaryPurpose: z.string().optional(),
  companyEmail: z.string().email('Invalid email address'),
  companyPhone: phoneValidation,
  alternateEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  alternatePhone: phoneValidation.optional().or(z.literal('')),
  incorporators: z.array(incorporatorSchema).min(1, 'At least one incorporator is required').max(5, 'Maximum of 5 incorporators')
    .superRefine((incorporators, ctx) => {
      incorporators.forEach((inc, index) => {
        if (!inc.birthdate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Birthdate is required",
            path: [index, "birthdate"],
          });
        }
      });
    }),
  corporateTreasurer: z.string().min(1, 'A treasurer must be selected'),
  treasurerEsecureId: z.string(),
  annualMeetingDate: z.union([z.date(), z.string().datetime()]).optional(),
  sharesDetails: z.object({
    authorizedCapital: z.coerce.number().min(1, 'Must be at least 1'),
    subscribedCapital: z.coerce.number().min(1, 'Must be at least 1'),
    paidUpCapital: z.coerce.number().min(1, 'Must be at least 1'),
    parValue: z.coerce.number().min(0.01, 'Must be at least 0.01'),
  }),
  leaseRent: z.coerce.number().min(0).optional(),
}).refine(data => !!data.annualMeetingDate, {
  message: "Annual meeting date is required",
  path: ["annualMeetingDate"],
}).refine(data => data.sharesDetails.subscribedCapital >= data.sharesDetails.authorizedCapital * 0.25, {
    message: "Subscribed Capital must be at least 25% of Authorized Capital.",
    path: ["sharesDetails", "subscribedCapital"],
}).refine(data => data.sharesDetails.paidUpCapital >= data.sharesDetails.subscribedCapital * 0.25, {
    message: "Paid-up Capital must be at least 25% of Subscribed Capital.",
    path: ["sharesDetails", "paidUpCapital"],
}).refine(data => data.sharesDetails.subscribedCapital <= data.sharesDetails.authorizedCapital, {
    message: "Subscribed Capital Stock cannot exceed Authorized Capital Stock.",
    path: ["sharesDetails", "subscribedCapital"],
}).refine(data => data.sharesDetails.paidUpCapital <= data.sharesDetails.subscribedCapital, {
    message: "Paid-up Capital Stock cannot exceed Subscribed Capital Stock.",
    path: ["sharesDetails", "paidUpCapital"],
}).refine(data => {
    const totalSharesSubscribed = data.incorporators.reduce((total, inc) => total + (inc.sharesSubscribed || 0), 0);
    return totalSharesSubscribed === data.sharesDetails.subscribedCapital;
}, {
    message: "Total shares subscribed by incorporators must equal the Subscribed Capital Stock.",
    path: ["sharesDetails", "subscribedCapital"],
}).refine(data => data.companyEmail !== data.alternateEmail, {
    message: "Alternate email must be different from the official email.",
    path: ["alternateEmail"],
}).refine(data => {
    if (!data.companyPhone || !data.alternatePhone) return true; // Don't validate if one is empty
    return data.companyPhone !== data.alternatePhone;
}, {
    message: "Alternate contact number must be different from the official contact number.",
    path: ["alternatePhone"],
}).refine(data => {
    if (data.corporateTreasurer) {
        const treasurer = data.incorporators.find(inc => inc.name === data.corporateTreasurer);
        return !!treasurer && !!treasurer.esecureId;
    }
    return true;
}, {
    message: "The selected treasurer must have an eSecure ID.",
    path: ["corporateTreasurer"],
});

export type BizRegFormValues = z.infer<typeof bizRegFormSchema>;


export const GeneratePrimaryPurposeInputSchema = z.object({
  industryDescription: z
    .string()
    .describe('A description of the business industry.'),
});
export type GeneratePrimaryPurposeInput = z.infer<typeof GeneratePrimaryPurposeInputSchema>;

export const GeneratePrimaryPurposeOutputSchema = z.object({
  primaryPurpose: z
    .string()
    .describe('The generated primary purpose statement.'),
});
export type GeneratePrimaryPurposeOutput = z.infer<typeof GeneratePrimaryPurposeOutputSchema>;
