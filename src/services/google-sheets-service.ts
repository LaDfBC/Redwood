import fetch from 'node-fetch';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class GoogleSheetsService {
    private apiKey: string;
    private spreadsheetId: string;

    constructor() {
        this.apiKey = ""
        this.spreadsheetId = ''
    }

    public async fetchCellValue(tab: string, cell: string): Promise<string> {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodeURIComponent(tab)}!${encodeURIComponent(cell)}?key=${this.apiKey}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Google Sheets API error: ${res.status} ${res.statusText}`);
        }
        const data = (await res.json()) as { values?: string[][] };
        return data.values?.[0]?.[0] ?? '(empty)';
    }
}
