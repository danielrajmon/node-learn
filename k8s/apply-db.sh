#!/bin/bash

# Script to initialize PostgreSQL database in Kubernetes
# Usage: ./init-db.sh <filename>
# Example: ./init-db.sh ddl.sql
#          ./init-db.sh dml-quizzes.sql

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <filename>"
    echo "   Example: $0 ddl.sql"
    echo "   Example: $0 dml-quizzes.sql"
    exit 1
fi

FILENAME="$1"

set -e

NAMESPACE="node-learn"
SERVICE="postgres"
LOCAL_PORT="5433"
REMOTE_PORT="5432"

echo "🔍 Checking if namespace exists..."
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo "❌ Namespace '$NAMESPACE' does not exist. Please create it first."
    exit 1
fi

echo "🔍 Checking if postgres pod is ready..."
POD_NAME=$(kubectl get pod -n $NAMESPACE -l app=postgres -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POD_NAME" ]; then
    echo "❌ No postgres pod found in namespace '$NAMESPACE'"
    exit 1
fi

# Wait for pod to be ready
echo "⏳ Waiting for postgres pod to be ready..."
kubectl wait --for=condition=ready pod/$POD_NAME -n $NAMESPACE --timeout=120s

# Get database credentials from secret
echo "🔑 Retrieving database credentials..."
POSTGRES_USER=$(kubectl get secret postgres-secret -n $NAMESPACE -o jsonpath='{.data.POSTGRES_USER}' | base64 -d)
POSTGRES_PASSWORD=$(kubectl get secret postgres-secret -n $NAMESPACE -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)
POSTGRES_DB=$(kubectl get secret postgres-secret -n $NAMESPACE -o jsonpath='{.data.POSTGRES_DB}' | base64 -d)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILE_PATH="$SCRIPT_DIR/../backend/src/migrations/$FILENAME"

if [ ! -f "$FILE_PATH" ]; then
    echo "❌ File not found: $FILE_PATH"
    exit 1
fi

echo "📝 Applying $FILENAME..."
if kubectl exec -n $NAMESPACE $POD_NAME -i -- psql -U $POSTGRES_USER -d $POSTGRES_DB < "$FILE_PATH"; then
    echo "✅ $FILENAME applied successfully"
else
    echo "❌ Failed to apply $FILENAME"
    exit 1
fi

echo "🎉 Database initialization completed successfully!"
