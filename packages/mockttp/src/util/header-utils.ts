import {
    Headers,
    RawHeaders
} from "../types";

/*

These utils support conversion between the various header representations that we deal
with. Those are:

- Flat arrays of [key, value, key, value, key, ...]. This is the raw header format
  generally used by Node.js's APIs throughout.
- Raw header tuple arrays like [[key, value], [key, value]]. This is our own raw header
  format, aiming to be fairly easy to use and to preserve header order, header dupes &
  header casing throughout.
- Formatted header objects of { key: value, key: value }. These are returned as the most
  convenient and consistent header format: keys are lowercased, and values are either
  strings or arrays of strings (for duplicate headers). This is returned by Node's APIs,
  but with some unclear normalization rules, so in practice we build raw headers and
  reconstruct this ourselves everyhere, by lowercasing & building arrays of values.

*/

export const findRawHeader = (rawHeaders: RawHeaders, targetKey: string) =>
    rawHeaders.find(([key]) => key.toLowerCase() === targetKey);

const findRawHeaders = (rawHeaders: RawHeaders, targetKey: string) =>
    rawHeaders.filter(([key]) => key.toLowerCase() === targetKey);

/**
 * Return node's _very_ raw headers ([k, v, k, v, ...]) into our slightly more convenient
 * pairwise tuples [[k, v], [k, v], ...] RawHeaders structure.
 */
export function pairFlatRawHeaders(flatRawHeaders: string[]): RawHeaders {
    const result: RawHeaders = [];
    for (let i = 0; i < flatRawHeaders.length; i += 2 /* Move two at a time */) {
        result[i/2] = [flatRawHeaders[i], flatRawHeaders[i+1]];
    }
    return result;
}

export function flattenPairedRawHeaders(rawHeaders: RawHeaders): string[] {
    return rawHeaders.flat();
}

/**
 * Take a raw headers, and turn them into headers, but without some of Node's concessions
 * to ease of use, i.e. keeping multiple values as arrays.
 */
export function rawHeadersToObject(rawHeaders: RawHeaders): Headers {
    return rawHeaders.reduce<Headers>((headers, [key, value]) => {
        key = key.toLowerCase();

        const existingValue = headers[key];

        if (Array.isArray(existingValue)) {
            existingValue.push(value);
        } else if (existingValue) {
            headers[key] = [existingValue, value];
        } else {
            headers[key] = value;
        }

        return headers;
    }, {});
}

export function objectHeadersToRaw(headers: Headers): RawHeaders {
    const rawHeaders: RawHeaders = [];

    for (let key in headers) {
        const value = headers[key];

        if (value === undefined) continue; // Drop undefined header values

        if (Array.isArray(value)) {
            value.forEach((v) => rawHeaders.push([key, v]));
        } else {
            rawHeaders.push([key, value]);
        }
    }

    return rawHeaders;
}

export function objectHeadersToFlat(headers: Headers): string[] {
    const flatHeaders: string[] = [];

    for (let key in headers) {
        const value = headers[key];

        if (value === undefined) continue; // Drop undefined header values

        if (Array.isArray(value)) {
            value.forEach((v) => {
                flatHeaders.push(key);
                flatHeaders.push(v);
            });
        } else {
            flatHeaders.push(key);
            flatHeaders.push(value);
        }
    }

    return flatHeaders;
}

// See https://httptoolkit.tech/blog/translating-http-2-into-http-1/ for details on the
// transformations required between H2 & H1 when proxying.
export function h2HeadersToH1(h2Headers: RawHeaders): RawHeaders {
    let h1Headers = h2Headers.filter(([key]) => key[0] !== ':');

    if (!findRawHeader(h1Headers, 'host') && findRawHeader(h2Headers, ':authority')) {
        h1Headers.unshift(['Host', findRawHeader(h2Headers, ':authority')![1]]);
    }

    // In HTTP/1 you MUST only send one cookie header - in HTTP/2 sending multiple is fine,
    // so we have to concatenate them:
    const cookieHeaders = findRawHeaders(h1Headers, 'cookie')
    if (cookieHeaders.length > 1) {
        h1Headers = h1Headers.filter(([key]) => key.toLowerCase() !== 'cookie');
        h1Headers.push(['Cookie', cookieHeaders.join('; ')]);
    }

    return h1Headers;
}

// Take from http2/util.js in Node itself
const HTTP2_ILLEGAL_HEADERS = [
    'connection',
    'upgrade',
    'host',
    'http2-settings',
    'keep-alive',
    'proxy-connection',
    'transfer-encoding'
];

export function h1HeadersToH2(headers: RawHeaders): RawHeaders {
    return headers.filter(([key]) =>
        !HTTP2_ILLEGAL_HEADERS.includes(key.toLowerCase())
    );
}