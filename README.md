# Forms Clone GraphQL

GraphQL API for a Google Forms alternative built with Node.js, Express, and SQLite.

## Features

- User registration and authentication
- Create and manage forms
- Multiple question types (text, multiple choice, checkbox, dropdown)
- Collect and manage responses
- Real-time updates with GraphQL subscriptions

## Tech Stack

- Node.js, Express.js, GraphQL
- SQLite database
- JWT authentication

## Installation

1. Clone the repository:
```bash
git clone https://github.com/BrigitaKasemets/Forms-clone-GraphQL.git
cd Forms-clone-GraphQL
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
npm run init-db
```

4. Start the development server:
```bash
npm run dev
```

The GraphQL server will be available at `http://localhost:4000/graphql`

## Configuration

Create a `.env` file:

## Usage

Visit `http://localhost:4000/graphql` to access GraphQL Playground.

## Development

Available scripts:
```bash
npm run dev      # Start development server
npm start        # Start production server
npm test         # Run tests
npm run lint     # Lint code
npm run init-db  # Initialize database
```
