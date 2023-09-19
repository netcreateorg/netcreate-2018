#!/bin/sh
# PDFGEN is a CLI development task runner written in Javascript.

# Check for node existence
if ! command -v node > /dev/null 2>&1; then
    echo "Node.js not found. Please ensure it's installed."
    exit 1
fi

# Use --max-old-space-size to limit memory (values are in MB, so 128 is 128MB)
DEBUG="--inspect-brk" # use --inspect-brk to break on first line
OPTS="--trace-warnings" # use --trace-warnings to show deprecation warnings

# Change the path below to the entry point of your node project
PROJECT_PATH="./_ur/node-builder"

# Explanation: 
# 2>&1 redirects stderr to stdout so they're combined
# Piping to 'cat' allows the output to maintain ANSI colors when printed to the terminal
node $OPTS $PROJECT_PATH/@cli-build-lib.cjs 2>&1 | cat
# Note: always have to build UR first, then you can run dependent tasks below
node $OPTS $PROJECT_PATH/@cli-build-app.cjs 2>&1 | cat
node $OPTS $PROJECT_PATH/@cli-dev-test.cjs 2>&1 | cat

# alternative ts-node version 
# node_modules/ts-node/dist/bin.js $DEBUG $PROJECT_PATH 2>&1 | cat

