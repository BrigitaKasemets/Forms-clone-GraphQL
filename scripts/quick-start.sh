#!/bin/bash

# ======================================================
# Forms Clone API - Complete Setup and Start
# ======================================================
# 
# This script installs dependencies and starts both
# REST API and GraphQL API servers
#
# Author: Brigita Kasemets
# ======================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}Forms Clone API - Complete Setup${NC}"
echo "=================================="
echo -e "Project root: ${CYAN}$PROJECT_ROOT${NC}"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to install dependencies
install_dependencies() {
    local dir_name="$1"
    local dir_path="$2"
    
    echo -e "\n${YELLOW}Installing dependencies for $dir_name...${NC}"
    
    if [ ! -d "$dir_path" ]; then
        echo -e "${RED}Error: Directory $dir_path not found${NC}"
        exit 1
    fi
    
    cd "$dir_path"
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}Error: package.json not found in $dir_path${NC}"
        exit 1
    fi
    
    npm install
    echo -e "${GREEN}✓ Dependencies installed for $dir_name${NC}"
}

# Setup database
setup_database() {
    echo -e "\n${YELLOW}Setting up database...${NC}"
    cd "$PROJECT_ROOT"
    
    if [ -f "scripts/init-db.js" ]; then
        node scripts/init-db.js
        echo -e "${GREEN}✓ Database initialized${NC}"
    else
        echo -e "${YELLOW}Warning: Database initialization script not found${NC}"
    fi
}

# Start GraphQL API server
start_graphql_server() {
    echo -e "\n${YELLOW}Starting GraphQL API server...${NC}"
    cd "$PROJECT_ROOT"
    
    if check_port 4000; then
        echo -e "${YELLOW}Port 4000 is already in use. GraphQL server may already be running.${NC}"
        return 0
    fi
    
    # Start GraphQL server in background
    npm run dev > logs/graphql.log 2>&1 &
    GRAPHQL_PID=$!
    
    # Wait for server to start
    echo -e "Waiting for GraphQL server to start..."
    for i in {1..15}; do
        if check_port 4000; then
            echo -e "${GREEN}✓ GraphQL API server started (PID: $GRAPHQL_PID) at http://localhost:4000${NC}"
            echo "$GRAPHQL_PID" > .graphql.pid
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    echo -e "\n${RED}Failed to start GraphQL server${NC}"
    return 1
}

# Start REST API server
start_rest_server() {
    echo -e "\n${YELLOW}Starting REST API server...${NC}"
    cd "$PROJECT_ROOT/REST-api"
    
    if check_port 3000; then
        echo -e "${YELLOW}Port 3000 is already in use. REST server may already be running.${NC}"
        return 0
    fi
    
    # Start REST server in background
    npm run dev > ../logs/rest.log 2>&1 &
    REST_PID=$!
    
    # Wait for server to start
    echo -e "Waiting for REST API server to start..."
    for i in {1..15}; do
        if check_port 3000; then
            echo -e "${GREEN}✓ REST API server started (PID: $REST_PID) at http://localhost:3000${NC}"
            echo "$REST_PID" > ../.rest.pid
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    echo -e "\n${RED}Failed to start REST server${NC}"
    return 1
}

# Create logs directory
create_logs_dir() {
    mkdir -p "$PROJECT_ROOT/logs"
}

# Check and create environment files
setup_environment() {
    echo -e "\n${YELLOW}Setting up environment configuration...${NC}"
    
    # Check GraphQL API .env file
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        echo -e "${YELLOW}Creating GraphQL API .env file...${NC}"
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        echo -e "${GREEN}✓ GraphQL .env file created from example${NC}"
    else
        echo -e "${GREEN}✓ GraphQL .env file exists${NC}"
    fi
    
    # Check REST API .env file
    if [ ! -f "$PROJECT_ROOT/REST-api/.env" ]; then
        echo -e "${YELLOW}Creating REST API .env file...${NC}"
        if [ -f "$PROJECT_ROOT/REST-api/.env.example" ]; then
            cp "$PROJECT_ROOT/REST-api/.env.example" "$PROJECT_ROOT/REST-api/.env"
            # Ensure JWT_SECRET matches between APIs
            JWT_SECRET=$(grep "JWT_SECRET=" "$PROJECT_ROOT/.env" | cut -d'=' -f2)
            if [ ! -z "$JWT_SECRET" ]; then
                sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" "$PROJECT_ROOT/REST-api/.env"
                echo -e "${GREEN}✓ REST .env file created with matching JWT_SECRET${NC}"
            else
                echo -e "${GREEN}✓ REST .env file created from example${NC}"
            fi
        else
            echo -e "${RED}Warning: REST API .env.example not found${NC}"
        fi
    else
        echo -e "${GREEN}✓ REST .env file exists${NC}"
    fi
}

# Health check function
health_check() {
    echo -e "\n${YELLOW}Performing health checks...${NC}"
    
    # Check GraphQL
    if curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"query { health { status message } }"}' \
        http://localhost:4000/graphql > /dev/null 2>&1; then
        echo -e "${GREEN}✓ GraphQL API health check passed${NC}"
    else
        echo -e "${RED}✗ GraphQL API health check failed${NC}"
    fi
    
    # Check REST
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ REST API health check passed${NC}"
    else
        echo -e "${RED}✗ REST API health check failed${NC}"
    fi
}

# Display server information
show_server_info() {
    echo -e "\n${BLUE}======================================================${NC}"
    echo -e "${BLUE}              SERVERS RUNNING${NC}"
    echo -e "${BLUE}======================================================${NC}"
    echo -e "${GREEN}✓ GraphQL API:${NC} http://localhost:4000"
    echo -e "  - GraphQL Playground: http://localhost:4000/graphql"
    echo -e "  - Schema Explorer: http://localhost:4000/schema"
    echo -e ""
    echo -e "${GREEN}✓ REST API:${NC} http://localhost:3000"
    echo -e "  - API Documentation: http://localhost:3000/api-docs"
    echo -e "  - Health Check: http://localhost:3000/health"
    echo -e ""
    echo -e "${CYAN}📁 Logs:${NC}"
    echo -e "  - GraphQL: logs/graphql.log"
    echo -e "  - REST: logs/rest.log"
    echo -e ""
    echo -e "${YELLOW}🛠️  Available commands:${NC}"
    echo -e "  - npm run test         # Run API comparison tests"
    echo -e "  - npm run client       # Test GraphQL API with example client"
    echo -e "  - npm run stop         # Stop both servers"
    echo -e ""
    echo -e "${BLUE}Press Ctrl+C to stop both servers${NC}"
    echo -e "${BLUE}======================================================${NC}"
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Stopping servers...${NC}"
    
    if [ -f "$PROJECT_ROOT/.graphql.pid" ]; then
        GRAPHQL_PID=$(cat "$PROJECT_ROOT/.graphql.pid")
        kill $GRAPHQL_PID 2>/dev/null || true
        rm -f "$PROJECT_ROOT/.graphql.pid"
        echo -e "${GREEN}✓ GraphQL server stopped${NC}"
    fi
    
    if [ -f "$PROJECT_ROOT/.rest.pid" ]; then
        REST_PID=$(cat "$PROJECT_ROOT/.rest.pid")
        kill $REST_PID 2>/dev/null || true
        rm -f "$PROJECT_ROOT/.rest.pid"
        echo -e "${GREEN}✓ REST server stopped${NC}"
    fi
    
    echo -e "${BLUE}Servers stopped. Goodbye!${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    # Create logs directory
    create_logs_dir
    
    # Setup environment files first
    setup_environment
    
    # Install dependencies for GraphQL API
    install_dependencies "GraphQL API" "$PROJECT_ROOT"
    
    # Install dependencies for REST API
    install_dependencies "REST API" "$PROJECT_ROOT/REST-api"
    
    # Setup database
    setup_database
    
    # Start both servers
    start_graphql_server
    start_rest_server
    
    # Health checks
    health_check
    
    # Show server information
    show_server_info
    
    # Keep script running
    echo -e "\n${CYAN}Both servers are running. Press Ctrl+C to stop.${NC}"
    
    # Monitor servers
    while true; do
        # Check if servers are still running
        if [ -f "$PROJECT_ROOT/.graphql.pid" ]; then
            GRAPHQL_PID=$(cat "$PROJECT_ROOT/.graphql.pid")
            if ! kill -0 $GRAPHQL_PID 2>/dev/null; then
                echo -e "${RED}GraphQL server has stopped unexpectedly${NC}"
                break
            fi
        fi
        
        if [ -f "$PROJECT_ROOT/.rest.pid" ]; then
            REST_PID=$(cat "$PROJECT_ROOT/.rest.pid")
            if ! kill -0 $REST_PID 2>/dev/null; then
                echo -e "${RED}REST server has stopped unexpectedly${NC}"
                break
            fi
        fi
        
        sleep 5
    done
}

# Run main function
main "$@"
