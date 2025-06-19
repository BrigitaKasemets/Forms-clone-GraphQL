#!/bin/bash

# ======================================================
# Forms Clone API - Detailne REST vs GraphQL test
# ======================================================
# 
# Test, mis võrdleb REST ja GraphQL API vastuseid
# detailse logimisega ja korrektse GraphQL süntaksiga
#
# Kasutamine: ./tests/comparison_test.sh
# ======================================================

# Värvid terminali väljundiks
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# API-de URL-id
REST_URL="http://localhost:3000"
GRAPHQL_URL="http://localhost:4000/graphql"

# Testitulemuste loendur
PASSED=0
FAILED=0

# Kustuta vanad comparison logid
echo "Kustutan vanad comparison logid..."
rm -f tests/comparison_*.log 2>/dev/null
echo "Vanad logid kustutatud."

# Logi fail
LOG_FILE="tests/comparison_$(date +%Y%m%d_%H%M%S).log"

# Abi funktsioonid
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
    echo "=== $1 ===" >> "$LOG_FILE"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    echo "✓ $1" >> "$LOG_FILE"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}✗ $1${NC}"
    echo "✗ $1" >> "$LOG_FILE"
    ((FAILED++))
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
    echo "ℹ $1" >> "$LOG_FILE"
}

print_comparison() {
    local title="$1"
    local rest_resp="$2"
    local graphql_resp="$3"
    
    echo -e "\n${CYAN}--- VÕRDLUS: $title ---${NC}"
    echo "" >> "$LOG_FILE"
    echo "--- VÕRDLUS: $title ---" >> "$LOG_FILE"
    echo "REST vastus:" >> "$LOG_FILE"
    echo "$rest_resp" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    echo "GraphQL vastus:" >> "$LOG_FILE"
    echo "$graphql_resp" >> "$LOG_FILE"
    echo "--- VÕRDLUS LÕPP ---" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
}

# Kontrolli, kas serverid töötavad
check_servers() {
    print_header "Kontrollime servereid"
    
    if curl -s "$REST_URL/health" > /dev/null; then
        print_success "REST API töötab (port 3000)"
    else
        print_fail "REST API ei tööta. Käivita: cd REST-api && npm run dev"
        exit 1
    fi
    
    if curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"query { health { ... on HealthStatus { status } } }"}' \
        "$GRAPHQL_URL" > /dev/null; then
        print_success "GraphQL API töötab (port 4000)"
    else
        print_fail "GraphQL API ei tööta. Käivita: npm run dev"
        exit 1
    fi
}

# Test 1: Health Check võrdlus
test_health_comparison() {
    print_header "Test 1: Health Check võrdlus"
    
    # REST API
    rest_health=$(curl -s "$REST_URL/health")
    rest_status="EBAÕNNESTUS"
    if echo "$rest_health" | grep -q '"status":"OK"'; then
        rest_status="ÕNNESTUS"
        print_success "REST health endpoint töötab"
    else
        print_fail "REST health endpoint ei tööta"
    fi
    
    # GraphQL API
    graphql_health=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"query { health { ... on HealthStatus { status message } } }"}' \
        "$GRAPHQL_URL")
    
    graphql_status="EBAÕNNESTUS"
    if echo "$graphql_health" | grep -q '"status":"OK"'; then
        graphql_status="ÕNNESTUS"
        print_success "GraphQL health endpoint töötab"
    else
        print_fail "GraphQL health endpoint ei tööta"
    fi
    
    # Võrdlus
    print_comparison "Health Check" "$rest_health" "$graphql_health"
    
    if [ "$rest_status" = "$graphql_status" ] && [ "$rest_status" = "ÕNNESTUS" ]; then
        print_success "Health Check võrdlus: Mõlemad tagastavad sama tulemuse"
    else
        print_fail "Health Check võrdlus: Erinevad tulemused (REST: $rest_status, GraphQL: $graphql_status)"
    fi
}

# Test 2: Kasutaja registreerimine võrdlus
test_user_registration_comparison() {
    print_header "Test 2: Kasutaja registreerimine võrdlus"
    
    local test_email="rest$(date +%s)@example.com"
    local test_user="restuser$(date +%s)"
    local test_password="TestPassword123"
    
    # REST API
    rest_register=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$test_email\",\"name\":\"$test_user\",\"password\":\"$test_password\"}" \
        "$REST_URL/users")
    
    rest_reg_status="EBAÕNNESTUS"
    if echo "$rest_register" | grep -q '"id"'; then
        rest_reg_status="ÕNNESTUS"
        print_success "REST kasutaja registreerimine töötab"
        REST_USER_ID=$(echo "$rest_register" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        export TEST_EMAIL="$test_email"
        export TEST_PASSWORD="$test_password"
        export USER_ID="$REST_USER_ID"
    else
        print_fail "REST kasutaja registreerimine ebaõnnestus"
    fi
    
    # GraphQL API (kasutame teist emaili)
    local graphql_email="graphql$(date +%s)@example.com"
    local graphql_user="graphqluser$(date +%s)"
    
    graphql_register=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"mutation { register(input: {email: \\\"$graphql_email\\\", name: \\\"$graphql_user\\\", password: \\\"$test_password\\\"}) { ... on User { id email name createdAt updatedAt } } }\"}" \
        "$GRAPHQL_URL")
    
    graphql_reg_status="EBAÕNNESTUS"
    if echo "$graphql_register" | grep -q '"id"'; then
        graphql_reg_status="ÕNNESTUS"
        print_success "GraphQL kasutaja registreerimine töötab"
        GRAPHQL_USER_ID=$(echo "$graphql_register" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        export GRAPHQL_EMAIL="$graphql_email"
        export GRAPHQL_USER_ID="$GRAPHQL_USER_ID"
    else
        print_fail "GraphQL kasutaja registreerimine ebaõnnestus"
    fi
    
    # Võrdlus
    print_comparison "Kasutaja registreerimine" "$rest_register" "$graphql_register"
    
    if [ "$rest_reg_status" = "$graphql_reg_status" ] && [ "$rest_reg_status" = "ÕNNESTUS" ]; then
        print_success "Registreerimise võrdlus: Mõlemad loovad kasutaja edukalt"
    else
        print_fail "Registreerimise võrdlus: Erinevad tulemused (REST: $rest_reg_status, GraphQL: $graphql_reg_status)"
    fi
}

# Test 3: Sisselogimise võrdlus
test_login_comparison() {
    print_header "Test 3: Sisselogimise võrdlus"
    
    if [ -z "$TEST_EMAIL" ]; then
        print_fail "Test email puudub - registreerimise test ebaõnnestus"
        return
    fi
    
    # REST API login
    rest_login=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        "$REST_URL/sessions")
    
    rest_login_status="EBAÕNNESTUS"
    if echo "$rest_login" | grep -q '"token"'; then
        rest_login_status="ÕNNESTUS"
        print_success "REST sisselogimine töötab"
        REST_TOKEN=$(echo "$rest_login" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    else
        print_fail "REST sisselogimine ebaõnnestus"
    fi
    
    # GraphQL API login
    graphql_login=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"mutation { login(input: {email: \\\"$GRAPHQL_EMAIL\\\", password: \\\"$TEST_PASSWORD\\\"}) { ... on Session { token userId } } }\"}" \
        "$GRAPHQL_URL")
    
    graphql_login_status="EBAÕNNESTUS"
    if echo "$graphql_login" | grep -q '"token"'; then
        graphql_login_status="ÕNNESTUS"
        print_success "GraphQL sisselogimine töötab"
        GRAPHQL_TOKEN=$(echo "$graphql_login" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    else
        print_fail "GraphQL sisselogimine ebaõnnestus"
    fi
    
    # Võrdlus
    print_comparison "Sisselogimine" "$rest_login" "$graphql_login"
    
    if [ "$rest_login_status" = "$graphql_login_status" ] && [ "$rest_login_status" = "ÕNNESTUS" ]; then
        print_success "Sisselogimise võrdlus: Mõlemad tagastavad tokeni"
    else
        print_fail "Sisselogimise võrdlus: Erinevad tulemused (REST: $rest_login_status, GraphQL: $graphql_login_status)"
    fi
}

# Test 4: Vormi loomise võrdlus
test_form_creation_comparison() {
    print_header "Test 4: Vormi loomise võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ]; then
        print_fail "Tokenid puuduvad - sisselogimise test ebaõnnestus"
        return
    fi
    
    local form_title="Test Form $(date +%s)"
    local form_description="Test description"
    
    # REST API
    rest_form=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $REST_TOKEN" \
        -d "{\"title\":\"$form_title\",\"description\":\"$form_description\"}" \
        "$REST_URL/forms")
    
    rest_form_status="EBAÕNNESTUS"
    if echo "$rest_form" | grep -q '"id"'; then
        rest_form_status="ÕNNESTUS"
        print_success "REST vormi loomine töötab"
        REST_FORM_ID=$(echo "$rest_form" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        export FORM_ID="$REST_FORM_ID"
    else
        print_fail "REST vormi loomine ebaõnnestus"
    fi
    
    # GraphQL API
    graphql_form=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"mutation { createForm(input: {title: \\\"$form_title\\\", description: \\\"$form_description\\\"}) { ... on Form { id title description userId createdAt updatedAt } } }\"}" \
        "$GRAPHQL_URL")
    
    graphql_form_status="EBAÕNNESTUS"
    if echo "$graphql_form" | grep -q '"id"'; then
        graphql_form_status="ÕNNESTUS"
        print_success "GraphQL vormi loomine töötab"
        GRAPHQL_FORM_ID=$(echo "$graphql_form" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        export GRAPHQL_FORM_ID="$GRAPHQL_FORM_ID"
    else
        print_fail "GraphQL vormi loomine ebaõnnestus"
    fi
    
    # Võrdlus
    print_comparison "Vormi loomine" "$rest_form" "$graphql_form"
    
    if [ "$rest_form_status" = "$graphql_form_status" ] && [ "$rest_form_status" = "ÕNNESTUS" ]; then
        print_success "Vormi loomise võrdlus: Mõlemad loovad vormi edukalt"
    else
        print_fail "Vormi loomise võrdlus: Erinevad tulemused (REST: $rest_form_status, GraphQL: $graphql_form_status)"
    fi
}

# Test 5: Vormide nimekirja võrdlus
test_forms_list_comparison() {
    print_header "Test 5: Vormide nimekirja võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ]; then
        print_fail "Tokenid puuduvad"
        return
    fi
    
    # REST API
    rest_forms=$(curl -s -H "Authorization: Bearer $REST_TOKEN" "$REST_URL/forms")
    
    rest_forms_status="EBAÕNNESTUS"
    if echo "$rest_forms" | grep -q '"id"'; then
        rest_forms_status="ÕNNESTUS"
        print_success "REST vormide nimekiri töötab"
        # Loeme vormide arvu
        rest_count=$(echo "$rest_forms" | grep -o '"id"' | wc -l | tr -d ' ')
    else
        print_fail "REST vormide nimekiri ebaõnnestus"
        rest_count=0
    fi
    
    # GraphQL API
    graphql_forms=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d '{"query":"query { forms { ... on FormsList { forms { id userId title description createdAt updatedAt } count } } }"}' \
        "$GRAPHQL_URL")
    
    graphql_forms_status="EBAÕNNESTUS"
    if echo "$graphql_forms" | grep -q '"id"'; then
        graphql_forms_status="ÕNNESTUS"
        print_success "GraphQL vormide nimekiri töötab"
        # Loeme vormide arvu
        graphql_count=$(echo "$graphql_forms" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    else
        print_fail "GraphQL vormide nimekiri ebaõnnestus"
        graphql_count=0
    fi
    
    # Võrdlus
    print_comparison "Vormide nimekiri" "$rest_forms" "$graphql_forms"
    
    if [ "$rest_forms_status" = "$graphql_forms_status" ] && [ "$rest_forms_status" = "ÕNNESTUS" ]; then
        print_success "Vormide nimekirja võrdlus: Mõlemad tagastavad vormide andmed"
        print_info "REST vormide arv: $rest_count, GraphQL vormide arv: $graphql_count"
    else
        print_fail "Vormide nimekirja võrdlus: Erinevad tulemused (REST: $rest_forms_status, GraphQL: $graphql_forms_status)"
    fi
}

# Test 6: Küsimuse lisamise võrdlus
test_question_creation_comparison() {
    print_header "Test 6: Küsimuse lisamise võrdlus"
    
    if [ -z "$REST_FORM_ID" ] || [ -z "$GRAPHQL_FORM_ID" ]; then
        print_fail "Vormi ID-d puuduvad"
        return
    fi
    
    local question_text="Test küsimus $(date +%s)"
    
    # REST API
    rest_question=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $REST_TOKEN" \
        -d "{\"text\":\"$question_text\",\"type\":\"shorttext\",\"required\":false}" \
        "$REST_URL/forms/$REST_FORM_ID/questions")
    
    rest_question_status="EBAÕNNESTUS"
    if echo "$rest_question" | grep -q '"id"'; then
        rest_question_status="ÕNNESTUS"
        print_success "REST küsimuse lisamine töötab"
        REST_QUESTION_ID=$(echo "$rest_question" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        export QUESTION_ID="$REST_QUESTION_ID"
    else
        print_fail "REST küsimuse lisamine ebaõnnestus"
    fi
    
    # GraphQL API
    graphql_question=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"mutation { createQuestion(formId: \\\"$GRAPHQL_FORM_ID\\\", input: {text: \\\"$question_text\\\", type: shorttext, required: false}) { ... on Question { id text type required options createdAt updatedAt } } }\"}" \
        "$GRAPHQL_URL")
    
    graphql_question_status="EBAÕNNESTUS"
    if echo "$graphql_question" | grep -q '"id"'; then
        graphql_question_status="ÕNNESTUS"
        print_success "GraphQL küsimuse lisamine töötab"
        GRAPHQL_QUESTION_ID=$(echo "$graphql_question" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        export GRAPHQL_QUESTION_ID="$GRAPHQL_QUESTION_ID"
    else
        print_fail "GraphQL küsimuse lisamine ebaõnnestus"
    fi
    
    # Võrdlus
    print_comparison "Küsimuse lisamine" "$rest_question" "$graphql_question"
    
    if [ "$rest_question_status" = "$graphql_question_status" ] && [ "$rest_question_status" = "ÕNNESTUS" ]; then
        print_success "Küsimuse lisamise võrdlus: Mõlemad lisavad küsimuse edukalt"
    else
        print_fail "Küsimuse lisamise võrdlus: Erinevad tulemused (REST: $rest_question_status, GraphQL: $graphql_question_status)"
    fi
}

# Test 7: Users list võrdlus
test_users_list_comparison() {
    print_header "Test 7: Users List võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ]; then
        print_fail "Tokenid puuduvad - jätame vahele"
        return
    fi
    
    # REST GET /users
    local rest_resp=$(curl -s \
        -H "Authorization: Bearer $REST_TOKEN" \
        "$REST_URL/users")
    
    # GraphQL users query
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d '{"query":"query { users { ... on UsersList { users { id email name createdAt updatedAt } count } ... on Error { code message } } }"}' \
        "$GRAPHQL_URL")
    
    print_comparison "Users List" "$rest_resp" "$graphql_resp"
    
    if echo "$rest_resp" | grep -q '"id"' && echo "$graphql_resp" | grep -q '"users"'; then
        print_success "Users list võrdlus õnnestus"
    else
        print_fail "Users list võrdlus ebaõnnestus"
    fi
}

# Test 8: Specific user võrdlus
test_user_get_comparison() {
    print_header "Test 8: Specific User võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$USER_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    # REST GET /users/{userId}
    local rest_resp=$(curl -s \
        -H "Authorization: Bearer $REST_TOKEN" \
        "$REST_URL/users/$USER_ID")
    
    # GraphQL user query
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"query { user(id: \\\"$USER_ID\\\") { ... on User { id email name createdAt updatedAt } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "Specific User" "$rest_resp" "$graphql_resp"
    
    if echo "$rest_resp" | grep -q '"id"' && echo "$graphql_resp" | grep -q '"id"'; then
        print_success "Specific user võrdlus õnnestus"
    else
        print_fail "Specific user võrdlus ebaõnnestus"
    fi
}

# Test 9: User update võrdlus
test_user_update_comparison() {
    print_header "Test 9: User Update võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$USER_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    local new_name="Updated Name $(date +%s)"
    
    # REST PATCH /users/{userId}
    local rest_resp=$(curl -s -X PATCH \
        -H "Authorization: Bearer $REST_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$new_name\"}" \
        "$REST_URL/users/$USER_ID")
    
    # GraphQL updateUser mutation
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"mutation { updateUser(id: \\\"$GRAPHQL_USER_ID\\\", input: {name: \\\"GraphQL $new_name\\\"}) { ... on User { id email name createdAt updatedAt } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "User Update" "$rest_resp" "$graphql_resp"
    
    if echo "$rest_resp" | grep -q '"name"' && echo "$graphql_resp" | grep -q '"name"'; then
        print_success "User update võrdlus õnnestus"
    else
        print_fail "User update võrdlus ebaõnnestus"
    fi
}

# Test 10: Form get võrdlus
test_form_get_comparison() {
    print_header "Test 10: Specific Form võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$FORM_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    # REST GET /forms/{formId}
    local rest_resp=$(curl -s \
        -H "Authorization: Bearer $REST_TOKEN" \
        "$REST_URL/forms/$FORM_ID")
    
    # GraphQL form query
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"query { form(id: \\\"$GRAPHQL_FORM_ID\\\") { ... on Form { id title description createdAt updatedAt questionCount responseCount } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "Specific Form" "$rest_resp" "$graphql_resp"
    
    if echo "$rest_resp" | grep -q '"id"' && echo "$graphql_resp" | grep -q '"id"'; then
        print_success "Specific form võrdlus õnnestus"
    else
        print_fail "Specific form võrdlus ebaõnnestus"
    fi
}

# Test 11: Form update võrdlus
test_form_update_comparison() {
    print_header "Test 11: Form Update võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$FORM_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    local new_title="Updated Form $(date +%s)"
    local new_description="Updated description"
    
    # REST PATCH /forms/{formId}
    local rest_resp=$(curl -s -X PATCH \
        -H "Authorization: Bearer $REST_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"$new_title\",\"description\":\"$new_description\"}" \
        "$REST_URL/forms/$FORM_ID")
    
    # GraphQL updateForm mutation
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"mutation { updateForm(id: \\\"$GRAPHQL_FORM_ID\\\", input: {title: \\\"GraphQL $new_title\\\", description: \\\"GraphQL $new_description\\\"}) { ... on Form { id title description createdAt updatedAt } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "Form Update" "$rest_resp" "$graphql_resp"
    
    if echo "$rest_resp" | grep -q '"title"' && echo "$graphql_resp" | grep -q '"title"'; then
        print_success "Form update võrdlus õnnestus"
    else
        print_fail "Form update võrdlus ebaõnnestus"
    fi
}

# Test 12: Questions list võrdlus
test_questions_list_comparison() {
    print_header "Test 12: Questions List võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$FORM_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    # REST GET /forms/{formId}/questions
    local rest_resp=$(curl -s \
        -H "Authorization: Bearer $REST_TOKEN" \
        "$REST_URL/forms/$FORM_ID/questions")
    
    # GraphQL questions query
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"query { questions(formId: \\\"$GRAPHQL_FORM_ID\\\") { ... on QuestionsList { questions { id text type required options order createdAt updatedAt } count } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "Questions List" "$rest_resp" "$graphql_resp"
    
    if echo "$rest_resp" | grep -q '\[' && echo "$graphql_resp" | grep -q '"questions"'; then
        print_success "Questions list võrdlus õnnestus"
    else
        print_fail "Questions list võrdlus ebaõnnestus"
    fi
}

# Test 13: Specific question võrdlus
test_question_get_comparison() {
    print_header "Test 13: Specific Question võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$FORM_ID" ] || [ -z "$QUESTION_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    # REST GET /forms/{formId}/questions/{questionId}
    local rest_resp=$(curl -s \
        -H "Authorization: Bearer $REST_TOKEN" \
        "$REST_URL/forms/$FORM_ID/questions/$QUESTION_ID")
    
    # GraphQL question query
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"query { question(formId: \\\"$GRAPHQL_FORM_ID\\\", id: \\\"$GRAPHQL_QUESTION_ID\\\") { ... on Question { id text type required options order createdAt updatedAt } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "Specific Question" "$rest_resp" "$graphql_resp"
    
    if echo "$rest_resp" | grep -q '"id"' && echo "$graphql_resp" | grep -q '"id"'; then
        print_success "Specific question võrdlus õnnestus"
    else
        print_fail "Specific question võrdlus ebaõnnestus"
    fi
}

# Test 14: Question update võrdlus
test_question_update_comparison() {
    print_header "Test 14: Question Update võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$FORM_ID" ] || [ -z "$QUESTION_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    local new_text="Updated question $(date +%s)?"
    
    # REST PATCH /forms/{formId}/questions/{questionId}
    local rest_resp=$(curl -s -X PATCH \
        -H "Authorization: Bearer $REST_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"$new_text\"}" \
        "$REST_URL/forms/$FORM_ID/questions/$QUESTION_ID")
    
    # GraphQL updateQuestion mutation
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"mutation { updateQuestion(formId: \\\"$GRAPHQL_FORM_ID\\\", id: \\\"$GRAPHQL_QUESTION_ID\\\", input: {text: \\\"GraphQL $new_text\\\"}) { ... on Question { id text type required options order createdAt updatedAt } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "Question Update" "$rest_resp" "$graphql_resp"
    
    if echo "$rest_resp" | grep -q '"text"' && echo "$graphql_resp" | grep -q '"text"'; then
        print_success "Question update võrdlus õnnestus"
    else
        print_fail "Question update võrdlus ebaõnnestus"
    fi
}

# Test 15: Response creation võrdlus
test_response_creation_comparison() {
    print_header "Test 15: Response Creation võrdlus"
    
    if [ -z "$FORM_ID" ] || [ -z "$QUESTION_ID" ] || [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    local respondent_name="Test Respondent $(date +%s)"
    local respondent_email="respondent$(date +%s)@example.com"
    local answer_text="Test answer from comparison test"
    
    # REST POST /forms/{formId}/responses (with authentication)
    local rest_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $REST_TOKEN" \
        -d "{\"answers\":[{\"questionId\":\"$QUESTION_ID\",\"answer\":\"$answer_text\"}],\"respondentName\":\"$respondent_name\",\"respondentEmail\":\"$respondent_email\"}" \
        "$REST_URL/forms/$FORM_ID/responses")
    
    # GraphQL createResponse mutation (with authentication)
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"mutation { createResponse(formId: \\\"$GRAPHQL_FORM_ID\\\", input: {answers: [{questionId: \\\"$GRAPHQL_QUESTION_ID\\\", answer: \\\"GraphQL $answer_text\\\"}], respondentName: \\\"GraphQL $respondent_name\\\", respondentEmail: \\\"gql$respondent_email\\\"}) { ... on Response { id respondentName respondentEmail createdAt updatedAt answerCount } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "Response Creation" "$rest_resp" "$graphql_resp"
    
    if echo "$rest_resp" | grep -q '"id"' && echo "$graphql_resp" | grep -q '"id"'; then
        # Salvestame response ID-d edasiseks kasutamiseks
        export RESPONSE_ID=$(echo "$rest_resp" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        export GRAPHQL_RESPONSE_ID=$(echo "$graphql_resp" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
        print_success "Response creation võrdlus õnnestus"
    else
        print_fail "Response creation võrdlus ebaõnnestus"
    fi
}

# Test 16: Responses list võrdlus
test_responses_list_comparison() {
    print_header "Test 16: Responses List võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$FORM_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    # REST GET /forms/{formId}/responses
    local rest_resp=$(curl -s \
        -H "Authorization: Bearer $REST_TOKEN" \
        "$REST_URL/forms/$FORM_ID/responses")
    
    # GraphQL responses query
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"query { responses(formId: \\\"$GRAPHQL_FORM_ID\\\") { ... on ResponsesList { responses { id respondentName respondentEmail createdAt updatedAt answerCount } count } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "Responses List" "$rest_resp" "$graphql_resp"
    
    if echo "$rest_resp" | grep -q '\[' && echo "$graphql_resp" | grep -q '"responses"'; then
        print_success "Responses list võrdlus õnnestus"
    else
        print_fail "Responses list võrdlus ebaõnnestus"
    fi
}

# Test 17: Specific response võrdlus
test_response_get_comparison() {
    print_header "Test 17: Specific Response võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$FORM_ID" ] || [ -z "$RESPONSE_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    # REST GET /forms/{formId}/responses/{responseId}
    local rest_resp=$(curl -s \
        -H "Authorization: Bearer $REST_TOKEN" \
        "$REST_URL/forms/$FORM_ID/responses/$RESPONSE_ID")
    
    # GraphQL response query
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"query { response(formId: \\\"$GRAPHQL_FORM_ID\\\", id: \\\"$GRAPHQL_RESPONSE_ID\\\") { ... on Response { id respondentName respondentEmail createdAt updatedAt answerCount } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "Specific Response" "$rest_resp" "$graphql_resp"
    
    if echo "$rest_resp" | grep -q '"id"' && echo "$graphql_resp" | grep -q '"id"'; then
        print_success "Specific response võrdlus õnnestus"
    else
        print_fail "Specific response võrdlus ebaõnnestus"
    fi
}

# Test 18: Response update võrdlus
test_response_update_comparison() {
    print_header "Test 18: Response Update võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$FORM_ID" ] || [ -z "$RESPONSE_ID" ] || [ -z "$QUESTION_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    local updated_name="Updated Respondent $(date +%s)"
    local updated_answer="Updated answer text"
    
    # REST PATCH /forms/{formId}/responses/{responseId}
    local rest_resp=$(curl -s -X PATCH \
        -H "Authorization: Bearer $REST_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"respondentName\":\"$updated_name\",\"answers\":[{\"questionId\":\"$QUESTION_ID\",\"answer\":\"$updated_answer\"}]}" \
        "$REST_URL/forms/$FORM_ID/responses/$RESPONSE_ID")
    
    # GraphQL updateResponse mutation
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"mutation { updateResponse(formId: \\\"$GRAPHQL_FORM_ID\\\", id: \\\"$GRAPHQL_RESPONSE_ID\\\", input: {respondentName: \\\"GraphQL $updated_name\\\", answers: [{questionId: \\\"$GRAPHQL_QUESTION_ID\\\", answer: \\\"GraphQL $updated_answer\\\"}]}) { ... on Response { id respondentName respondentEmail createdAt updatedAt answerCount } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "Response Update" "$rest_resp" "$graphql_resp"
    
    if echo "$rest_resp" | grep -q '"respondentName"' && echo "$graphql_resp" | grep -q '"respondentName"'; then
        print_success "Response update võrdlus õnnestus"
    else
        print_fail "Response update võrdlus ebaõnnestus"
    fi
}

# Test 19: Question delete võrdlus
test_question_delete_comparison() {
    print_header "Test 19: Question Delete võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$FORM_ID" ] || [ -z "$QUESTION_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    # Loome uue küsimuse deletemiseks
    local delete_question_text="Question to delete $(date +%s)"
    
    # REST: Loo uus küsimus deletemiseks
    local create_resp=$(curl -s -X POST \
        -H "Authorization: Bearer $REST_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"$delete_question_text\",\"type\":\"shorttext\",\"required\":false}" \
        "$REST_URL/forms/$FORM_ID/questions")
    
    local delete_question_id=$(echo "$create_resp" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    if [ -n "$delete_question_id" ]; then
        # REST DELETE /forms/{formId}/questions/{questionId}
        local rest_resp=$(curl -s -w "HTTP_STATUS:%{http_code}" -X DELETE \
            -H "Authorization: Bearer $REST_TOKEN" \
            "$REST_URL/forms/$FORM_ID/questions/$delete_question_id")
        
        local rest_status=$(echo "$rest_resp" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)
        local rest_body=$(echo "$rest_resp" | sed 's/HTTP_STATUS:[0-9]*$//')
        
        rest_resp="HTTP Status: $rest_status, Body: '$rest_body'"
        
        # GraphQL: Loo uus küsimus deletemiseks
        local graphql_create_resp=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $GRAPHQL_TOKEN" \
            -d "{\"query\":\"mutation { createQuestion(formId: \\\"$GRAPHQL_FORM_ID\\\", input: {text: \\\"GraphQL $delete_question_text\\\", type: shorttext, required: false}) { ... on Question { id text type required options createdAt updatedAt } ... on Error { code message } } }\"}" \
            "$GRAPHQL_URL")
        
        local graphql_delete_question_id=$(echo "$graphql_create_resp" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
        
        if [ -n "$graphql_delete_question_id" ]; then
            # GraphQL deleteQuestion mutation
            local graphql_resp=$(curl -s -X POST \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $GRAPHQL_TOKEN" \
                -d "{\"query\":\"mutation { deleteQuestion(formId: \\\"$GRAPHQL_FORM_ID\\\", id: \\\"$graphql_delete_question_id\\\") { ... on SuccessResult { success message } ... on Error { code message } } }\"}" \
                "$GRAPHQL_URL")
            
            print_comparison "Question Delete" "$rest_resp" "$graphql_resp"
            
            if (echo "$rest_resp" | grep -q "HTTP Status: 204") && echo "$graphql_resp" | grep -q '"success"'; then
                print_success "Question delete võrdlus õnnestus"
            else
                print_fail "Question delete võrdlus ebaõnnestus"
            fi
        else
            print_fail "GraphQL küsimuse loomine ebaõnnestus"
        fi
    else
        print_fail "REST küsimuse loomine ebaõnnestus"
    fi
}

# Test 20: Response delete võrdlus
test_response_delete_comparison() {
    print_header "Test 20: Response Delete võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$FORM_ID" ] || [ -z "$RESPONSE_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    # REST DELETE /forms/{formId}/responses/{responseId}
    local rest_resp=$(curl -s -w "HTTP_STATUS:%{http_code}" -X DELETE \
        -H "Authorization: Bearer $REST_TOKEN" \
        "$REST_URL/forms/$FORM_ID/responses/$RESPONSE_ID")
    
    local rest_status=$(echo "$rest_resp" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)
    local rest_body=$(echo "$rest_resp" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    rest_resp="HTTP Status: $rest_status, Body: '$rest_body'"
    
    # GraphQL deleteResponse mutation
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"mutation { deleteResponse(formId: \\\"$GRAPHQL_FORM_ID\\\", id: \\\"$GRAPHQL_RESPONSE_ID\\\") { ... on SuccessResult { success message } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "Response Delete" "$rest_resp" "$graphql_resp"
    
    if (echo "$rest_resp" | grep -q "HTTP Status: 204") && echo "$graphql_resp" | grep -q '"success"'; then
        print_success "Response delete võrdlus õnnestus"
    else
        print_fail "Response delete võrdlus ebaõnnestus"
    fi
}

# Test 21: Form delete võrdlus
test_form_delete_comparison() {
    print_header "Test 21: Form Delete võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$FORM_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    # REST DELETE /forms/{formId}
    local rest_resp=$(curl -s -w "HTTP_STATUS:%{http_code}" -X DELETE \
        -H "Authorization: Bearer $REST_TOKEN" \
        "$REST_URL/forms/$FORM_ID")
    
    local rest_status=$(echo "$rest_resp" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)
    local rest_body=$(echo "$rest_resp" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    rest_resp="HTTP Status: $rest_status, Body: '$rest_body'"
    
    # GraphQL deleteForm mutation
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"mutation { deleteForm(id: \\\"$GRAPHQL_FORM_ID\\\") { ... on SuccessResult { success message } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "Form Delete" "$rest_resp" "$graphql_resp"
    
    if (echo "$rest_resp" | grep -q "HTTP Status: 204") && echo "$graphql_resp" | grep -q '"success"'; then
        print_success "Form delete võrdlus õnnestus"
    else
        print_fail "Form delete võrdlus ebaõnnestus"
    fi
}

# Test 22: User delete võrdlus
test_user_delete_comparison() {
    print_header "Test 22: User Delete võrdlus"
    
    if [ -z "$REST_TOKEN" ] || [ -z "$GRAPHQL_TOKEN" ] || [ -z "$USER_ID" ]; then
        print_fail "Andmed puuduvad - jätame vahele"
        return
    fi
    
    # REST DELETE /users/{userId}
    local rest_resp=$(curl -s -w "HTTP_STATUS:%{http_code}" -X DELETE \
        -H "Authorization: Bearer $REST_TOKEN" \
        "$REST_URL/users/$USER_ID")
    
    local rest_status=$(echo "$rest_resp" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)
    local rest_body=$(echo "$rest_resp" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    rest_resp="HTTP Status: $rest_status, Body: '$rest_body'"
    
    # GraphQL deleteUser mutation
    local graphql_resp=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GRAPHQL_TOKEN" \
        -d "{\"query\":\"mutation { deleteUser(id: \\\"$GRAPHQL_USER_ID\\\") { ... on SuccessResult { success message } ... on Error { code message } } }\"}" \
        "$GRAPHQL_URL")
    
    print_comparison "User Delete" "$rest_resp" "$graphql_resp"
    
    if (echo "$rest_resp" | grep -q "HTTP Status: 204") && echo "$graphql_resp" | grep -q '"success"'; then
        print_success "User delete võrdlus õnnestus"
    else
        print_fail "User delete võrdlus ebaõnnestus"
    fi
}

# Peafunktsioon
main() {
    echo -e "${BLUE}Forms Clone API - REST vs GraphQL võrdlustest${NC}"
    echo "================================================="
    echo "Logitakse detailselt faili: $LOG_FILE"
    echo ""
    
    # Alustame logimist
    echo "Forms Clone API - REST vs GraphQL võrdlustest" > "$LOG_FILE"
    echo "Testi kuupäev: $(date)" >> "$LOG_FILE"
    echo "=================================================" >> "$LOG_FILE"
    
    check_servers
    test_health_comparison
    test_user_registration_comparison
    test_login_comparison
    test_users_list_comparison
    test_user_get_comparison
    test_user_update_comparison
    test_form_creation_comparison
    test_forms_list_comparison
    test_form_get_comparison
    test_form_update_comparison
    test_question_creation_comparison
    test_questions_list_comparison
    test_question_get_comparison
    test_question_update_comparison
    test_question_delete_comparison
    test_response_creation_comparison
    test_responses_list_comparison
    test_response_get_comparison
    test_response_update_comparison
    test_response_delete_comparison
    test_form_delete_comparison
    test_user_delete_comparison
    
    # Lõplik aruanne
    echo ""
    echo -e "${BLUE}=== VÕRDLUSTESTI TULEMUSED ===${NC}"
    echo -e "Õnnestunud testid: ${GREEN}$PASSED${NC}"
    echo -e "Ebaõnnestunud testid: ${RED}$FAILED${NC}"
    echo -e "Kokku teste: $((PASSED + FAILED))"
    echo -e "Detailne logi: ${CYAN}$LOG_FILE${NC}"
    
    # Samad andmed logifaili
    echo "" >> "$LOG_FILE"
    echo "=== VÕRDLUSTESTI TULEMUSED ===" >> "$LOG_FILE"
    echo "Õnnestunud testid: $PASSED" >> "$LOG_FILE"
    echo "Ebaõnnestunud testid: $FAILED" >> "$LOG_FILE"
    echo "Kokku teste: $((PASSED + FAILED))" >> "$LOG_FILE"
    echo "Testi lõpp: $(date)" >> "$LOG_FILE"
    
    if [ $FAILED -eq 0 ]; then
        echo -e "\n${GREEN}🎉 Kõik võrdlustestid õnnestusid! REST ja GraphQL API-d töötavad identses${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Mõned võrdlustestid ebaõnnestusid. Vaata logifaili: $LOG_FILE${NC}"
        exit 1
    fi
}

# Käivita peafunktsioon
main "$@"
