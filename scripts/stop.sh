#!/bin/bash

# ======================================================
# Forms Clone API - Stop Servers
# ======================================================
# 
# This script stops both REST API and GraphQL API servers
#
# Author: Brigita Kasemets
# ======================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}Stopping Forms Clone API servers...${NC}"

# Stop GraphQL server
if [ -f "$PROJECT_ROOT/.graphql.pid" ]; then
    GRAPHQL_PID=$(cat "$PROJECT_ROOT/.graphql.pid")
    if kill -0 $GRAPHQL_PID 2>/dev/null; then
        kill $GRAPHQL_PID
        echo -e "${GREEN}✓ GraphQL server stopped (PID: $GRAPHQL_PID)${NC}"
    else
        echo -e "${YELLOW}GraphQL server was not running${NC}"
    fi
    rm -f "$PROJECT_ROOT/.graphql.pid"
else
    echo -e "${YELLOW}No GraphQL server PID file found${NC}"
fi

# Stop REST server
if [ -f "$PROJECT_ROOT/.rest.pid" ]; then
    REST_PID=$(cat "$PROJECT_ROOT/.rest.pid")
    if kill -0 $REST_PID 2>/dev/null; then
        kill $REST_PID
        echo -e "${GREEN}✓ REST server stopped (PID: $REST_PID)${NC}"
    else
        echo -e "${YELLOW}REST server was not running${NC}"
    fi
    rm -f "$PROJECT_ROOT/.rest.pid"
else
    echo -e "${YELLOW}No REST server PID file found${NC}"
fi

# Also try to kill any processes on the default ports as backup
echo -e "\n${YELLOW}Checking for any remaining processes on default ports...${NC}"

# Kill process on port 3000 (REST API)
REST_PROCESS=$(lsof -ti:3000 2>/dev/null || true)
if [ ! -z "$REST_PROCESS" ]; then
    kill $REST_PROCESS 2>/dev/null || true
    echo -e "${GREEN}✓ Killed process on port 3000${NC}"
fi

# Kill process on port 4000 (GraphQL API)
GRAPHQL_PROCESS=$(lsof -ti:4000 2>/dev/null || true)
if [ ! -z "$GRAPHQL_PROCESS" ]; then
    kill $GRAPHQL_PROCESS 2>/dev/null || true
    echo -e "${GREEN}✓ Killed process on port 4000${NC}"
fi

echo -e "\n${BLUE}All servers stopped.${NC}"
