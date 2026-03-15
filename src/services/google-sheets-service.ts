import fetch from 'node-fetch';
import { createRequire } from 'node:module';
import { sheets, auth } from '@googleapis/sheets'

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class GoogleSheetsService {
    private spreadsheetId: string;
    private privateKey: string;
    private email: string;

    constructor() {
        this.privateKey = Config.googleSheets.privateKey;
        this.email = Config.googleSheets.email;
    }

    public async fetchCellValue(tab: string, cell: string): Promise<string> {
        const jwt = new auth.JWT({
            email: this.email,
            key: this.privateKey.split(String.raw`\n`).join('\n'),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        const sheet = sheets({version:"v4", auth: jwt})

        let res = await sheet.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${tab}!${cell}`
        })

        return res.data.values[0][0]
    }

    public async fetchRange(tab: string, range: string, spreadsheetIdOverride?: string): Promise<any[][]> {
        const jwt = new auth.JWT({
            email: this.email,
            key: this.privateKey.split(String.raw`\n`).join('\n'),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        const sheet = sheets({ version: 'v4', auth: jwt });
        const res = await sheet.spreadsheets.values.get({
            spreadsheetId: spreadsheetIdOverride ?? this.spreadsheetId,
            range: `${tab}!${range}`,
        });
        return res.data.values ?? [];
    }
}
