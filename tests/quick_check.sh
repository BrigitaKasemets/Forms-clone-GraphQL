#!/bin/bash

# ======================================================
# Forms Clone API - Väga kiire põhitest
# ======================================================
# 
# Kontrollime ainult, kas API-d töötavad ja vastavad
# Ei testi andmebaasi toiminguid
#
# Kasutamine: ./tests/quick_check.sh
# ======================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Forms Clone API - Kiire kontroll${NC}"
echo "================================"

# REST API
echo -n "REST API (port 3000): "
if curl -s http://localhost:3000/health | grep -q "OK"; then
    echo -e "${GREEN}✓ Töötab${NC}"
else
    echo -e "${RED}✗ Ei tööta${NC}"
fi

# GraphQL API  
echo -n "GraphQL API (port 4000): "
if curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"query { health { ... on HealthStatus { status } } }"}' \
    http://localhost:4000/graphql | grep -q "OK"; then
    echo -e "${GREEN}✓ Töötab${NC}"
else
    echo -e "${RED}✗ Ei tööta${NC}"
fi

echo ""
echo "Kui mõlemad on märgitud ✓, siis API-d töötavad korralikult!"
echo "Täielikuks testimiseks käivita: ./tests/simple_test.sh"
