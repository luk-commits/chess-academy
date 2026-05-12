#!/bin/sh
set -e

for f in /migrations/*.sql; do
  echo "Applying: $f"
  psql -f "$f"
done

echo 'All migrations applied successfully'
