#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read version from package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Create version.json content
const versionJson = {
    version: version
};

// Write to dist/lib/version.json
const distPath = path.join(__dirname, '..', 'dist', 'lib', 'version.json');
const distDir = path.dirname(distPath);

// Ensure directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

fs.writeFileSync(distPath, JSON.stringify(versionJson, null, 4) + '\n', 'utf8');

console.log(`Updated version.json with version: ${version}`);
