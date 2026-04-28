#!/bin/bash

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Creating folder structure for Driver Services App...${NC}"

# Create directory structure
mkdir -p src/app/\(auth\)/sign-in
mkdir -p src/app/\(auth\)/sign-up
mkdir -p src/app/\(dashboard\)/dashboard
mkdir -p src/app/\(dashboard\)/requests
mkdir -p src/app/\(dashboard\)/profile
mkdir -p src/app/admin/dashboard
mkdir -p src/app/admin/verifications
mkdir -p src/app/admin/service-requests
mkdir -p src/app/verify

# Components
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/services
mkdir -p src/components/admin
mkdir -p src/components/verification

# Lib
mkdir -p src/lib/supabase
mkdir -p src/lib/utils
mkdir -p src/lib/validations

# Hooks
mkdir -p src/hooks

# Contexts
mkdir -p src/contexts

# Types
mkdir -p src/types

# Supabase migrations
mkdir -p supabase/migrations

# Public images
mkdir -p public/images

echo -e "${GREEN}Folder structure created successfully!${NC}"

# Create placeholder .gitkeep files
echo -e "${YELLOW}Creating placeholder files...${NC}"
find src -type d -exec touch {}/.gitkeep \;

echo -e "${GREEN}Setup complete!${NC}"
