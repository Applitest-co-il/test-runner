#!/bin/bash

# Remove the dist directory if it exists
rm -rf ./dist

# Create the necessary directories
mkdir -p ./dist
mkdir -p ./dist/bin
mkdir -p ./dist/bin/src
mkdir -p ./dist/bin/downloads
mkdir -p ./dist/bin/reports

# Copy the .keep files
cp ./downloads/.keep ./dist/bin/downloads/
cp ./reports/.keep ./dist/bin/downloads/

# Copy the src directory contents
cp -r ./src/* ./dist/bin/src/

# Copy package files and LICENSE
cp ./package* ./dist/bin/
cp ./LICENSE ./dist/bin/

# Compress the bin directory into a zip file
zip -r ./dist/test-runner.zip ./dist/bin/*
