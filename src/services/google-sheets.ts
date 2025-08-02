/**
 * @fileOverview A service to interact with Google Sheets.
 */
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { BizRegFormValues } from '@/lib/schemas';
import { format, parseISO } from 'date-fns';

const SPREADSHEET_ID = '1WV8O4pABjn7b_MeZyHpNDZjpBF7HDE5l3Ta1Z2VKpKg';
const SHEET_NAME = 'Sheet1'; 

if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY must be set in .env');
}

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

function flattenObject(obj: any, parentKey = '', result: {[key: string]: any} = {}) {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newKey = parentKey ? `${parentKey}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
                flattenObject(obj[key], newKey, result);
            } else if (Array.isArray(obj[key])) {
                if (key === 'incorporators') {
                    obj[key].forEach((item: any, index: number) => {
                        const incorporatorKey = `incorporator_${index + 1}`;
                        flattenObject(item, incorporatorKey, result);
                    });
                } else {
                    result[newKey] = JSON.stringify(obj[key]);
                }
            } else if (obj[key] instanceof Date) {
                result[newKey] = format(obj[key], 'yyyy-MM-dd');
            } else if ((key === 'birthdate' || key === 'annualMeetingDate') && typeof obj[key] === 'string') {
                try {
                    const parsedDate = parseISO(obj[key]);
                    result[newKey] = format(parsedDate, 'yyyy-MM-dd');
                } catch (e) {
                     result[newKey] = obj[key];
                }
            }
            else {
                result[newKey] = obj[key];
            }
        }
    }
    return result;
}

function getSheetHeaders() {
    const headers = [
        'corporationNames.name1', 'corporationNames.name2', 'corporationNames.name3',
        'principalOfficeAddress.street', 'principalOfficeAddress.barangay', 'principalOfficeAddress.city', 'principalOfficeAddress.province', 'principalOfficeAddress.zipCode',
        'industryDescription', 'primaryPurpose', 'secondaryPurpose',
        'companyEmail', 'companyPhone', 'alternateEmail', 'alternatePhone',
        'corporateTreasurer', 'treasurerEsecureId', 'annualMeetingDate',
        'sharesDetails.authorizedCapital', 'sharesDetails.subscribedCapital', 'sharesDetails.paidUpCapital', 'sharesDetails.parValue'
    ];

    for (let i = 1; i <= 5; i++) {
        const prefix = `incorporator_${i}`;
        headers.push(
            `${prefix}.name`, `${prefix}.tin`, `${prefix}.nationality`,
            `${prefix}.residence.street`, `${prefix}.residence.barangay`, `${prefix}.residence.city`, `${prefix}.residence.province`, `${prefix}.residence.zipCode`,
            `${prefix}.sharesSubscribed`, `${prefix}.amountSubscribed`, `${prefix}.birthdate`, `${prefix}.esecureId`
        );
    }
    return headers;
}

export async function appendToSheet(data: BizRegFormValues) {
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[SHEET_NAME];
  if (!sheet) {
    throw new Error(`Sheet with name "${SHEET_NAME}" not found.`);
  }

  const flattenedData = flattenObject(data);

  try {
    // Try to load the header row. This will throw an error if it's empty.
    await sheet.loadHeaderRow();
    if (sheet.headerValues.length === 0) {
      throw new Error('Header row is empty, re-creating.');
    }
  } catch (e) {
    // If it fails (e.g., sheet is blank), set the headers.
    const headers = getSheetHeaders();
    await sheet.setHeaderRow(headers);
  }

  const headers = sheet.headerValues;
  const newRow: Record<string, any> = {};

  // Map flattened data to the correct header
  for (const header of headers) {
    if (flattenedData[header] !== undefined) {
      newRow[header] = flattenedData[header];
    } else {
      newRow[header] = ''; // Ensure all header cells are populated
    }
  }

  // Add the new row
  await sheet.addRow(newRow);
}
