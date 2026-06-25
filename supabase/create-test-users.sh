#!/usr/bin/env bash
# Creates the three test auth users in Supabase.
# Run once against your project: bash supabase/create-test-users.sh
# Requires: supabase CLI logged in, SUPABASE_PROJECT_ID set or passed as $1

set -e

PROJECT=${1:-$SUPABASE_PROJECT_ID}

if [ -z "$PROJECT" ]; then
  echo "Usage: bash supabase/create-test-users.sh <project-id>"
  echo "  or set SUPABASE_PROJECT_ID environment variable"
  exit 1
fi

echo "Creating test users in project: $PROJECT"

supabase --project-ref "$PROJECT" auth admin create-user \
  --email customer@test.wattsmart.co.uk \
  --password TestCustomer123! \
  --user-metadata '{"role":"customer"}' 2>/dev/null || echo "  customer already exists"

supabase --project-ref "$PROJECT" auth admin create-user \
  --email installer@test.wattsmart.co.uk \
  --password TestInstaller123! \
  --user-metadata '{"role":"installer"}' 2>/dev/null || echo "  installer already exists"

supabase --project-ref "$PROJECT" auth admin create-user \
  --email admin@test.wattsmart.co.uk \
  --password TestAdmin123! \
  --user-metadata '{"role":"admin"}' 2>/dev/null || echo "  admin already exists"

echo ""
echo "Done. Now run supabase/seed.sql in the Supabase SQL editor."
