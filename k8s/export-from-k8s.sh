#!/bin/bash

# Export data from Kubernetes PostgreSQL to file
# Usage: ./export-from-k8s.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_FILE="$SCRIPT_DIR/../backend/src/migrations/data.sql"
NAMESPACE="node-learn"

echo "🔄 Exporting data from Kubernetes PostgreSQL..."

# Get the postgres pod name
POD_NAME=$(kubectl get pod -n $NAMESPACE -l app=postgres -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POD_NAME" ]; then
  echo "❌ Could not find postgres pod in namespace $NAMESPACE"
  exit 1
fi

echo "📦 Found postgres pod: $POD_NAME"

# Export data from K8s
kubectl exec -n $NAMESPACE $POD_NAME -- pg_dump -U postgres \
  -d node-learn-questions \
  --data-only \
  --column-inserts \
  -t questions -t choices > "$DATA_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Data exported successfully to: $DATA_FILE"
  echo "📊 File size: $(du -h "$DATA_FILE" | cut -f1)"
else
  echo "❌ Export failed!"
  exit 1
fi
