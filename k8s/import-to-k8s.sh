#!/bin/bash

# Import data from exported file to Kubernetes PostgreSQL
# Usage: ./import-to-k8s.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_FILE="$SCRIPT_DIR/../backend/src/migrations/data.sql"
NAMESPACE="node-learn"

if [ ! -f "$DATA_FILE" ]; then
  echo "❌ Data file not found: $DATA_FILE"
  echo "Run ./export-data.sh first to export data from Docker"
  exit 1
fi

echo "🔄 Importing data to Kubernetes PostgreSQL..."

# Get the postgres pod name
POD_NAME=$(kubectl get pod -n $NAMESPACE -l app=postgres -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POD_NAME" ]; then
  echo "❌ Could not find postgres pod in namespace $NAMESPACE"
  exit 1
fi

echo "📦 Found postgres pod: $POD_NAME"
echo "🗑️  Truncating existing data..."

# Truncate tables first for clean overwrite
kubectl exec -n $NAMESPACE $POD_NAME -- psql -U postgres -d node-learn-questions -c "TRUNCATE TABLE choices, questions RESTART IDENTITY CASCADE;"

if [ $? -ne 0 ]; then
  echo "⚠️  Warning: Truncate failed, continuing anyway..."
fi

echo "⏸️  Disabling triggers..."
kubectl exec -n $NAMESPACE $POD_NAME -- psql -U postgres -d node-learn-questions -c "ALTER TABLE questions DISABLE TRIGGER ALL; ALTER TABLE choices DISABLE TRIGGER ALL;"

echo "📥 Importing data..."
kubectl exec -n $NAMESPACE $POD_NAME -i -- psql -U postgres -d node-learn-questions < "$DATA_FILE"

echo "▶️  Re-enabling triggers..."
kubectl exec -n $NAMESPACE $POD_NAME -- psql -U postgres -d node-learn-questions -c "ALTER TABLE questions ENABLE TRIGGER ALL; ALTER TABLE choices ENABLE TRIGGER ALL;"

if [ $? -eq 0 ]; then
  echo "✅ Data imported successfully to Kubernetes!"
else
  echo "❌ Import failed!"
  exit 1
fi
