🎯 Recommended Git Workflow Strategy
1. Current State Assessment
First, let's understand where you are:

Feature Branch: feature/onboarding-wizard (OnboardingWizard development)
Main Branch: 
main
 (production fixes needed)
Challenge: Need to switch contexts without losing work or creating conflicts
2. Safe Branch Switching Strategy
Option A: Stash & Switch (Quick fixes)

bash
# On feature/onboarding-wizard branch
git add .
git stash push -m "WIP: OnboardingWizard DataUploadValidator updates"

# Switch to main for bug fixes
git checkout main
git pull origin main

# Fix bugs, commit, push
git add .
git commit -m "fix: duplicate key in ThermometerVerificationSection"
git push origin main

# Return to feature work
git checkout feature/onboarding-wizard
git stash pop
Option B: Commit & Branch (Recommended)

bash
# On feature/onboarding-wizard branch - commit your current work
git add .
git commit -m "feat: update DataUploadValidator with JSON recipes format

- Updated recipes field to use comprehensive JSON structure
- Added ingredient breakdown with product codes and costs
- Made staff emails optional with optionalFields array
- All CSV templates now accurately mirror actual template files"

# Switch to main for bug fixes
git checkout main
git pull origin main

# Create hotfix branch for the bug
git checkout -b hotfix/thermometer-verification-duplicate-key

# Fix the bug, commit, and merge
git add .
git commit -m "fix: remove duplicate 'gap' key in ThermometerVerificationSection"
git push origin hotfix/thermometer-verification-duplicate-key

# Merge to main (or create PR)
git checkout main
git merge hotfix/thermometer-verification-duplicate-key
git push origin main

# Return to feature development
git checkout feature/onboarding-wizard
3. Advanced: Worktree Strategy (Best for Complex Projects)
bash
# Create separate working directories for each branch
git worktree add ../cleantrac-main main
git worktree add ../cleantrac-feature feature/onboarding-wizard

# Now you can work in both simultaneously:
# - /cleantrac_cleaning_schedule (current - feature branch)
# - /cleantrac-main (main branch fixes)
# - /cleantrac-feature (feature development)
4. Immediate Action Plan
Step 1: Fix the Current Error

bash
# Fix the duplicate key error in ThermometerVerificationSection.jsx
# Line 112-114: Remove duplicate 'gap' property
Step 2: Commit Current Feature Work

bash
git add .
git commit -m "feat: enhance DataUploadValidator with comprehensive CSV/JSON templates

- Updated all required fields to match actual CSV templates
- Added JSON format support for recipes with ingredient breakdown
- Made staff emails optional for practical onboarding
- Enhanced field validation with proper examples and descriptions"
Step 3: Create Bug Fix Branch

bash
git checkout main
git pull origin main
git checkout -b hotfix/duplicate-key-fix