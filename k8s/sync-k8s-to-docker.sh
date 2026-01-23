#!/bin/bash

# Sync data from Kubernetes PostgreSQL to Docker PostgreSQL
# Usage: ./sync-k8s-to-docker.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../scripts"

echo "🔄 Syncing data from Kubernetes to Docker..."
echo ""

# Step 1: Export from K8s
echo "Step 1/2: Exporting from Kubernetes..."
"$SCRIPT_DIR/export-from-k8s.sh"
echo ""

# Step 2: Import to Docker
echo "Step 2/2: Importing to Docker..."
"$MIGRATIONS_DIR/import-to-docker.sh"
echo ""

echo "🎉 Sync complete! Kubernetes → Docker"
