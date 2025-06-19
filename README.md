# Forms Clone GraphQL

GraphQL API for a Google Forms alternative built with Node.js, Express, and SQLite.


**Setup ja arendus:**
```bash
# Täielik setup ja käivitamine
npm run quick-start

# Käivita klient (test API)
npm run client

# Ainult andmebaasi setup
npm run init-db

# Development server
npm run dev
```




### Option 1: Using the startup scripts (Recommended)

**Production mode:**
```bash
./scripts/run.sh
```

**Development mode (with auto-restart on file changes):**
```bash
./scripts/run-dev.sh
```

### Option 2: Using npm scripts
```bash
npm run quick-start
```

### Option 3: Setup and start separately
```bash
npm run setup
npm start
```

## Installation

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

Edit `.env` file with your settings

4. Initialize the database:
```bash
npm run init-db
```

5. Start the development server:
```bash
npm run dev
```

The GraphQL server will be available at `http://localhost:4000/graphql`

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

## Development

For development details and additional configuration, see the "Kiirscriptid (Quick Scripts)" section above.
