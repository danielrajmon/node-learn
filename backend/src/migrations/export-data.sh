#!/bin/bash

# Export data from Docker PostgreSQL to file
# Usage: ./export-data.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_FILE="$SCRIPT_DIR/data.sql"

echo "🔄 Exporting data from Docker PostgreSQL..."

# Export data from Docker container
docker exec node-learn-postgresql pg_dump -U postgres \
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
