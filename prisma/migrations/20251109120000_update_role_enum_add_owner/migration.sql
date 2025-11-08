-- Alter enum Role to support OWNER and drop deprecated STAFF value
CREATE TYPE "Role_new" AS ENUM ('OWNER', 'ADMIN', 'CUSTOMER');

-- Ensure legacy STAFF roles are migrated to CUSTOMER before type switch
UPDATE "User"
SET "role" = 'CUSTOMER'
WHERE "role" = 'STAFF';

-- Apply new enum type
ALTER TABLE "User"
ALTER COLUMN "role" TYPE "Role_new"
USING (
  CASE
    WHEN "role"::text = 'STAFF' THEN 'CUSTOMER'
    ELSE "role"::text
  END::"Role_new"
);

-- Preserve default value after enum swap
ALTER TABLE "User"
ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';

-- Replace old enum with the new definition
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
