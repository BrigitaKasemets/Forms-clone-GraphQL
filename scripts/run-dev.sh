echo "Starting Forms Clone GraphQL Server (Development Mode)..."
echo "============================================================"

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

# Step 3: Start the development server with auto-restart
echo "Starting the development server with auto-restart..."
echo "Server will be available at http://localhost:4000"
echo "GraphQL Playground will be available at http://localhost:4000/graphql"
echo ""
echo "File changes will automatically restart the server"
echo "Press Ctrl+C to stop the server"
echo "============================================================"

npm run dev
