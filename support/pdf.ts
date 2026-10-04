import fs from 'fs';
import zlib from 'zlib';

/**
 * Minimal text extraction for the certificate PDF, with no PDF dependency.
 *
 * The certificate number exists nowhere in the UI — it is printed on the PDF
 * and read back from the database by the BDD suite. This suite has no DB
 * access (§9), so the PDF is the only place a test can learn it. The SUT
 * builds the PDF with @react-pdf/renderer using the standard Helvetica/Times
 * fonts, which means each text run is a plain hex string inside a deflated
 * content stream: `[<43> -33 <65> ...] TJ`. This unpacks exactly that and
 * nothing more — it is not a general PDF parser, and it will return an empty
 * string for a PDF that embeds subset fonts. If the SUT ever switches to
 * embedded fonts, this is the file to revisit.
 */
export function extractPdfText(path: string): string {
    const raw = fs.readFileSync(path).toString('latin1');
    const runs: string[] = [];

    const streamStart = /stream\r?\n/g;
    let match: RegExpExecArray | null;
    while ((match = streamStart.exec(raw))) {
        const bodyStart = match.index + match[0].length;
        const bodyEnd = raw.indexOf('endstream', bodyStart);
        let content: string;
        try {
            content = zlib.inflateSync(Buffer.from(raw.slice(bodyStart, bodyEnd), 'latin1')).toString('latin1');
        } catch {
            continue; // not a deflated stream (fonts, images) — nothing to read
        }

        for (const run of content.matchAll(/\[((?:[^\]]|\n)*?)\]\s*TJ/g)) {
            let text = '';
            for (const hex of run[1].matchAll(/<([0-9a-fA-F]*)>/g)) {
                text += Buffer.from(hex[1], 'hex').toString('latin1');
            }
            runs.push(text);
        }
    }

    return runs.join('\n');
}

/** First `CERT-YYYY-XXXXX` number printed on the certificate PDF, or null. */
export function extractCertificateNumber(path: string): string | null {
    return extractPdfText(path).match(/CERT-\d{4}-[A-Z0-9]{5}/)?.[0] ?? null;
}
