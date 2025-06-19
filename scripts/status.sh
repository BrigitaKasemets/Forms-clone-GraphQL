#!/bin/bash

# Quick check if both servers are running and responding

echo "Checking server status..."

# Check REST API
echo -n "REST API (port 3000): "
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ Running"
else
    echo "✗ Not responding"
fi

# Check GraphQL API  
echo -n "GraphQL API (port 4000): "
if curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"query { health { status } }"}' \
    http://localhost:4000/graphql > /dev/null 2>&1; then
    echo "✓ Running"
else
    echo "✗ Not responding"
fi

echo ""
echo "Useful URLs:"
echo "  REST API: http://localhost:3000"
echo "  GraphQL API: http://localhost:4000"
echo "  GraphQL Playground: http://localhost:4000/graphql"
