#!/bin/bash

# Install Dependencies Script
# This script installs all dependencies from package.json in the correct categories
# Using latest versions (no version pinning)

set -e

echo "Select a package manager:"
echo "  1) npm"
echo "  2) yarn"
echo "  3) pnpm"
read -r -p "Enter choice [1-3]: " choice

case "$choice" in
  1) PM="npm";  ADD="npm install";    ADD_DEV="npm install -D" ;;
  2) PM="yarn"; ADD="yarn add";       ADD_DEV="yarn add -D" ;;
  3) PM="pnpm"; ADD="pnpm add";       ADD_DEV="pnpm add -D" ;;
  *) echo "❌ Invalid choice. Exiting."; exit 1 ;;
esac

if ! command -v "$PM" &> /dev/null; then
  echo "❌ $PM is not installed. Please install it first."
  exit 1
fi

echo ""
echo "📦 Installing production dependencies with $PM..."
$ADD \
  react \
  react-dom \
  @stylexjs/stylex \
  @react-router/node \
  @react-router/serve \
  react-router

echo ""
echo "🛠️  Installing development dependencies with $PM..."
$ADD_DEV \
  @eslint/js \
  @types/node \
  @types/react \
  @types/react-dom \
  babel-plugin-react-compiler \
  eslint \
  eslint-config-prettier \
  eslint-plugin-perfectionist \
  eslint-plugin-react-hooks \
  eslint-plugin-react-refresh \
  eslint-plugin-security \
  eslint-plugin-unicorn \
  globals \
  knip \
  prettier \
  typescript \
  typescript-eslint \
  vite \
  eslint-plugin-react-x \
  eslint-plugin-react-dom \
  @stylexjs/unplugin \
  unplugin \
  @react-router/dev \
  vite-plugin-babel

echo ""
echo "✅ All dependencies installed successfully with $PM!"
