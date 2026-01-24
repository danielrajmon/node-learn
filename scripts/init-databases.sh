#!/bin/bash
set -e

export $(grep -v '^#' .env | xargs)

CONTAINER="node-learn-postgresql"

# Create databases
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -tc "SELECT 1 FROM pg_database WHERE datname = 'auth'" | grep -q 1 || docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -c "CREATE DATABASE auth OWNER $POSTGRES_USER"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -tc "SELECT 1 FROM pg_database WHERE datname = 'questions'" | grep -q 1 || docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -c "CREATE DATABASE questions OWNER $POSTGRES_USER"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -tc "SELECT 1 FROM pg_database WHERE datname = 'quiz'" | grep -q 1 || docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -c "CREATE DATABASE quiz OWNER $POSTGRES_USER"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -tc "SELECT 1 FROM pg_database WHERE datname = 'achievements'" | grep -q 1 || docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -c "CREATE DATABASE achievements OWNER $POSTGRES_USER"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -tc "SELECT 1 FROM pg_database WHERE datname = 'leaderboard'" | grep -q 1 || docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -c "CREATE DATABASE leaderboard OWNER $POSTGRES_USER"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -tc "SELECT 1 FROM pg_database WHERE datname = 'admin'" | grep -q 1 || docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -c "CREATE DATABASE admin OWNER $POSTGRES_USER"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -tc "SELECT 1 FROM pg_database WHERE datname = 'maintenance'" | grep -q 1 || docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d template1 -c "CREATE DATABASE maintenance OWNER $POSTGRES_USER"

# Apply DDL scripts
echo "Applying DDL: questions-ddl.sql -> questions DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d questions < "$(dirname "$0")/sql/questions-ddl.sql"
echo "Applying DDL: choices-ddl.sql -> questions DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d questions < "$(dirname "$0")/sql/choices-ddl.sql"
echo "Applying DDL: quiz_modes-ddl.sql -> quiz DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d quiz < "$(dirname "$0")/sql/quiz_modes-ddl.sql"
echo "Applying DDL: user_question_stats-ddl.sql -> quiz DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d quiz < "$(dirname "$0")/sql/user_question_stats-ddl.sql"
echo "Applying DDL: achievements-ddl.sql -> achievements DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d achievements < "$(dirname "$0")/sql/achievements-ddl.sql"
echo "Applying DDL: achievement_user_question_stats-ddl.sql -> achievements DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d achievements < "$(dirname "$0")/sql/achievement_user_question_stats-ddl.sql"
echo "Applying DDL: user_achievements-ddl.sql -> achievements DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d achievements < "$(dirname "$0")/sql/user_achievements-ddl.sql"
echo "Applying DDL: leaderboards-ddl.sql -> leaderboard DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d leaderboard < "$(dirname "$0")/sql/leaderboards-ddl.sql"
echo "Applying DDL: users-ddl.sql -> admin DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d admin < "$(dirname "$0")/sql/users-ddl.sql"
echo "Applying DDL: users-ddl.sql -> auth DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d auth < "$(dirname "$0")/sql/users-ddl.sql"
echo "Applying DDL: users-ddl.sql -> leaderboard DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d leaderboard < "$(dirname "$0")/sql/users-ddl.sql"

# Apply DML scripts
echo "Applying DML: users-dml.sql -> admin DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d admin < "$(dirname "$0")/sql/users-dml.sql"
echo "Applying DML: users-dml.sql -> auth DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d auth < "$(dirname "$0")/sql/users-dml.sql"
echo "Applying DML: users-dml.sql -> leaderboard DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d leaderboard < "$(dirname "$0")/sql/users-dml.sql"
echo "Applying DML: quiz_modes-dml.sql -> quiz DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d quiz < "$(dirname "$0")/sql/quiz_modes-dml.sql"
echo "Applying DML: achievements-dml.sql -> achievements DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d achievements < "$(dirname "$0")/sql/achievements-dml.sql"
echo "Applying DML: questions_and_choices-dml.sql -> questions DB"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" $CONTAINER psql -U "$POSTGRES_USER" -d questions < "$(dirname "$0")/sql/questions_and_choices-dml.sql"
echo "Done!"
