#!/bin/bash

# Sync data from Docker PostgreSQL to Kubernetes PostgreSQL
# Usage: ./sync-docker-to-k8s.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../backend/src/migrations"

echo "🔄 Syncing data from Docker to Kubernetes..."
echo ""

# Step 1: Export from Docker
echo "Step 1/2: Exporting from Docker..."
"$MIGRATIONS_DIR/export-data.sh"
echo ""

# Step 2: Import to K8s
echo "Step 2/2: Importing to Kubernetes..."
"$SCRIPT_DIR/import-to-k8s.sh"
echo ""

echo "🎉 Sync complete! Docker → Kubernetes"
