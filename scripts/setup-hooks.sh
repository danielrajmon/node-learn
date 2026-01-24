#!/bin/bash

# Setup script to install git hooks

echo "Installing git hooks..."

# Make sure hooks directory exists
mkdir -p .git/hooks

# Copy pre-commit hook
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✓ Pre-commit hook installed successfully!"
echo "The hook will automatically update version.json on every commit."
