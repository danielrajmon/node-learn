#!/bin/bash

# Migration script to:
# 1. Rename question_text column to question
# 2. Rename long_answer column to answer
# 3. Add quiz column after answer

set -e

# Configuration
DB_CONTAINER="node-learn-postgresql"
DB_NAME="node-learn-questions"
DB_USER="postgres"

echo "Starting migration: Rename columns and add quiz column"

# Execute SQL commands
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME <<'EOF'
BEGIN;

-- Rename question_text to question
ALTER TABLE questions RENAME COLUMN question_text TO question;

-- Rename long_answer to answer
ALTER TABLE questions RENAME COLUMN long_answer TO answer;

-- Add quiz column after answer (TEXT type, nullable)
ALTER TABLE questions ADD COLUMN quiz TEXT;

COMMIT;

-- Verify changes
\d questions
EOF

echo "Migration completed successfully!"
echo ""
echo "Changes applied:"
echo "  - question_text renamed to question"
echo "  - long_answer renamed to answer"
echo "  - quiz column added (TEXT, nullable)"
