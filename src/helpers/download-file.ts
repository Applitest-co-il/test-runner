import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';
import { URL } from 'url';
import { logger } from './log-service';

// Define an allow-list of trusted hostnames/endpoints (adjust as appropriate)
// if host start and ends with / it's treated as regex pattern, if not as exact match

// Explicit list of trusted S3 domains (add more as needed)
const ALLOWED_HOSTS: string[] = [
    's3.amazonaws.com',
    's3.us-east-1.amazonaws.com',
    's3.us-west-1.amazonaws.com',
    's3.us-west-2.amazonaws.com',
    // add other well-known S3 regional endpoints here
];

function isAllowedUrl(urlString: string): boolean {
    try {
        const parsedUrl = new URL(urlString, 'https://dummy-base.com'); // fallback base for relative

        // Enforce HTTPS (always require 'https')
        if (parsedUrl.protocol !== 'https:') return false;

        // Block credentials in URL
        if (parsedUrl.username || parsedUrl.password) return false;

        // Explicit port control (allow only standard 443)
        if (parsedUrl.port && parsedUrl.port !== '443') return false;

        // Block IP addresses—including private/internal ranges
        const ipV4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
        const ipV6Regex = /^\[[0-9a-fA-F:]+?\]$/;
        const host = parsedUrl.hostname;
        if (
            ipV4Regex.test(host) ||
            ipV6Regex.test(host) ||
            // Private IPv4 ranges
            /^10\./.test(host) ||
            /^127\./.test(host) ||
            /^192\.168\./.test(host) ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
            // Localhost
            host === 'localhost' ||
            host === '::1'
        ) {
            return false;
        }

        // Hostname must exactly match the allowed list
        if (!ALLOWED_HOSTS.includes(host)) return false;

        // Path traversal checks: block "..", "//", percent-encoded equivalents
        const pathname = parsedUrl.pathname || '';
        if (
            pathname.includes('..') ||
            pathname.includes('//') ||
            /%2e/i.test(pathname) ||
            /%2f/i.test(pathname)
        ) {
            return false;
        }

        // Optionally: block query strings/fragments (for S3, should not need these)
        if (parsedUrl.search || parsedUrl.hash) return false;

        return true;
    } catch (e) {
        logger.error(`Invalid URL: ${urlString} - ${(e as Error).message}`);
        return false;
    }
}

export async function downloadFile(url: string, fileName: string, override: boolean = false): Promise<string | null> {
    const fileLocalPath =
        process.env.NODE_ENV === 'prod' ? `/tmp/${fileName}` : `${process.cwd()}/downloads/${fileName}`;

    if (!override) {
        const existLocalApp = fs.existsSync(fileLocalPath);
        if (existLocalApp) {
            logger.info(`App ${fileLocalPath} already downloaded`);
            return fileLocalPath;
        }
    }

    // SSRF protection: Only allow URLs from trusted hosts
    if (!isAllowedUrl(url)) {
        logger.error(`Blocked attempt to download from disallowed URL: ${url}`);
        return null;
    }

    logger.info(`Downloading file from ${url} to ${fileLocalPath}`);

    let downloadResponse: AxiosResponse;
    try {
        downloadResponse = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream'
        });
    } catch (error) {
        logger.error(`Error downloading file ${url}: ${error}`);
        return null;
    }

    logger.info(`Download response status: ${downloadResponse.status}`);
    logger.info(`Starting saving file to ${fileLocalPath}`);

    const writer = fs.createWriteStream(fileLocalPath);
    downloadResponse.data.pipe(writer);

    const promise = new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    return promise
        .then(() => {
            logger.info(`File downloaded successfully ${fileLocalPath}`);
            return fileLocalPath;
        })
        .catch((error) => {
            logger.error(`Error downloading file ${url}: ${error}`);
            return null;
        });
}
