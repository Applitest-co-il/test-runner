#!/bin/bash

# Remove the dist directory if it exists
rm -rf ./dist

# Create the necessary directories
mkdir -p ./dist
mkdir -p ./dist/bin
mkdir -p ./dist/bin/src
mkdir -p ./dist/bin/downloads
mkdir -p ./dist/bin/reports
mkdir -p ./dist/bin/apps

# Copy the .keep files
cp ./downloads/.keep ./dist/bin/downloads/
cp ./reports/.keep ./dist/bin/reports/

# Copy the src directory contents
cp -r ./src/* ./dist/bin/src/

# Copy the apps directory contents
cp -r ./apps/* ./dist/bin/apps/

# Copy package files and LICENSE
cp ./package* ./dist/bin/
cp ./LICENSE ./dist/bin/

# Compress the bin directory into a zip file
cd ./dist
cd ./bin
zip -r ../test-runner.zip ./*
cd ..
cd ..
