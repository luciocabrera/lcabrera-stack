#!/bin/bash

# Install Dependencies Script
# This script installs all dependencies from package.json in the correct categories
# Using latest versions (no version pinning)

set -e

echo "📦 Installing production dependencies..."
yarn add \
  react \
  react-dom \
  @stylexjs/stylex

echo ""
echo "🛠️  Installing development dependencies..."
yarn add -D \
  @eslint/js \
  @types/node \
  @types/react \
  @types/react-dom \
  @vitejs/plugin-react \
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
  unplugin

echo ""
echo "✅ All dependencies installed successfully!"
