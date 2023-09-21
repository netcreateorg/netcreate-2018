#!/bin/sh
# UR is a CLI development task runner that invokes the URSYS CLI build library

# Make sure NodeJS is installed
if ! command -v node > /dev/null 2>&1; then
    echo "Node.js not found. Please ensure it's installed."
    exit 1
fi

# PATHS
UR_BUILD="./_ur"
MODS_BUILD="./_ur_mods"
CLI_BUILD="./_ur_build"

# Use --max-old-space-size to limit memory (values are in MB, so 128 is 128MB)
DEBUG="--inspect-brk" # use --inspect-brk to break on first line
OPTS="--trace-warnings" # use --trace-warnings to show deprecation warnings

# (1) always build library first
node $OPTS $UR_BUILD/@ur-build-lib.cjs 2>&1 | cat

# (2) add additional tasks here (eventually can be command args)
# node $OPTS $CLI_BUILD/@cli-build-app.cjs 2>&1 | cat
node $OPTS $MODS_BUILD/@ur-build-mods.cjs 2>&1 | cat
# node $OPTS $CLI_BUILD/@cli-dev-test.cjs 2>&1 | cat

