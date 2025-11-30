#!/bin/bash

# Script to initialize PostgreSQL database in Kubernetes
# This script:
# 1. Opens a port-forward to the postgres pod
# 2. Applies the DDL and DML scripts
# 3. Closes the port-forward

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
DDL_FILE="$SCRIPT_DIR/../backend/src/migrations/ddl.sql"
DML_FILE="$SCRIPT_DIR/../backend/src/migrations/dml.sql"

echo "📝 Applying DDL script..."
if kubectl exec -n $NAMESPACE $POD_NAME -i -- psql -U $POSTGRES_USER -d $POSTGRES_DB < "$DDL_FILE"; then
    echo "✅ DDL script applied successfully"
else
    echo "❌ Failed to apply DDL script"
    exit 1
fi

echo "🎉 Database initialization completed successfully!"
