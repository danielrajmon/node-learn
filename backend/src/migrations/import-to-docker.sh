#!/bin/bash

# Import data from exported file to Docker PostgreSQL
# Usage: ./import-to-docker.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_FILE="$SCRIPT_DIR/data.sql"

if [ ! -f "$DATA_FILE" ]; then
  echo "❌ Data file not found: $DATA_FILE"
  echo "Run ./export-from-k8s.sh first to export data from Kubernetes"
  exit 1
fi

echo "🔄 Importing data to Docker PostgreSQL..."
echo "🗑️  Truncating existing data..."

# Truncate tables first for clean overwrite
docker exec node-learn-postgresql psql -U postgres -d node-learn-questions -c "TRUNCATE TABLE choices, questions RESTART IDENTITY CASCADE;"

if [ $? -ne 0 ]; then
  echo "⚠️  Warning: Truncate failed, continuing anyway..."
fi

echo "⏸️  Disabling triggers..."
docker exec node-learn-postgresql psql -U postgres -d node-learn-questions -c "ALTER TABLE questions DISABLE TRIGGER ALL; ALTER TABLE choices DISABLE TRIGGER ALL;"

echo "📥 Importing data..."
docker exec -i node-learn-postgresql psql -U postgres -d node-learn-questions < "$DATA_FILE"

echo "▶️  Re-enabling triggers..."
docker exec node-learn-postgresql psql -U postgres -d node-learn-questions -c "ALTER TABLE questions ENABLE TRIGGER ALL; ALTER TABLE choices ENABLE TRIGGER ALL;"

if [ $? -eq 0 ]; then
  echo "✅ Data imported successfully to Docker!"
else
  echo "❌ Import failed!"
  exit 1
fi
