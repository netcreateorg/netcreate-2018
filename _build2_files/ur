#!/bin/sh
# PDFGEN is a CLI development task runner written in Javascript.

# Check for node existence
if ! command -v node > /dev/null 2>&1; then
    echo "Node.js not found. Please ensure it's installed."
    exit 1
fi

# Use --max-old-space-size to limit memory (values are in MB, so 128 is 128MB)
# NODE_OPTIONS="--max-old-space-size=128"

# Change the path below to the entry point of your node project
PROJECT_PATH="./ur_runner.mjs"

# regular node version 
node $NODE_OPTIONS $PROJECT_PATH 2>&1 | cat

# ts-node version 
# node_modules/ts-node/dist/bin.js $NODE_OPTIONS $PROJECT_PATH 2>&1 | cat

# Explanation: 
# 2>&1 redirects stderr to stdout so they're combined
# Piping to 'cat' allows the output to maintain ANSI colors when printed to the terminal