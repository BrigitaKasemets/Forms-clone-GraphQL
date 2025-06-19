echo "Starting Forms Clone GraphQL Server..."
echo "======================================"

# Step 1: Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Step 2: Initialize database
echo "Initializing database..."
npm run init-db

if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi

# Step 3: Start the server
echo "Starting the server..."
echo "Server will be available at http://localhost:4000"
echo "GraphQL Playground will be available at http://localhost:4000/graphql"
echo ""
echo "Press Ctrl+C to stop the server"
echo "======================================"

npm start
