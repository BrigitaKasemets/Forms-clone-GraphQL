# Forms Clone GraphQL

GraphQL API for a Google Forms alternative built with Node.js, Express, and SQLite.

## Peamised käsud

```bash
# Installib mõlema API dependenciesid ja käivitab mõlemad serverid
npm run quick-start

# Kontrolli serverite seisundit
npm run status

# Peatab mõlemad serverid
npm run stop

```
## Testing

Projekt sisaldab põhjalikku testisüsteemi, mis võrdleb REST ja GraphQL API vastuseid.

```bash
# Võrdle REST ja GraphQL API vastuseid
npm run test

# Kiire test serveritele
npm run test:quick
```

**Muud kasulikud käsud:**
```bash
# Käivita klient (test GraphQL API)
npm run client

# Ainult andmebaasi setup
npm run init-db

```

## Start guid 

1. **Klooni repo ja käivita:**
   ```bash
   git clone <repo-url>
   cd Forms-clone-GraphQL
   npm run quick-start
   ```

2. **Mõlemad API-d töötavad:**
   - 🟢 **GraphQL API:** http://localhost:4000
   - 🟢 **REST API:** http://localhost:3000

3. **Testi API-sid:**
   ```bash
   npm run test
   ```

## 🛠️ Alternatiivsed käivitamise viisid

**Ainult GraphQL API:**
```bash
npm install
npm run init-db
npm run dev    # Käivitab GraphQL serveri port 4000
```

**Ainult REST API:**
```bash
cd REST-api
npm install
npm run dev    # Käivitab REST serveri port 3000
```

## API Usage

### GraphQL Playground

Visit `http://localhost:4000/graphql` to access the interactive GraphQL Playground where you can:
- Explore the schema documentation
- Write and test queries and mutations
- View query results in real-time

### Example Queries

#### Health Check
```graphql
query HealthCheck {
  health {
    ... on HealthStatus {
      status
      message
      timestamp
    }
  }
}
```

#### User Registration
```graphql
mutation RegisterUser {
  register(input: {
    email: "user@example.com"
    password: "password123"
    name: "Test User"
  }) {
    ... on User {
      id
      email
      name
      createdAt
    }
    ... on Error {
      code
      message
    }
  }
}
```

#### Login
```graphql
mutation LoginUser {
  login(input: {
    email: "user@example.com"
    password: "password123"
  }) {
    ... on Session {
      token
      userId
      user {
        id
        email
        name
      }
    }
    ... on Error {
      code
      message
    }
  }
}
```

