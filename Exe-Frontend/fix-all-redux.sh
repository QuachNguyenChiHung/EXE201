#!/bin/bash
# Script to remove all Redux dependencies and make app runnable
# Run: bash fix-all-redux.sh

echo "Removing Redux store directory..."
rm -rf src/store

echo "Creating stub files for any missing imports..."

# Create empty stub files to prevent import errors temporarily
mkdir -p src/store/slices
touch src/store/index.ts
touch src/store/hooks.ts

# Add stub exports to prevent errors
cat > src/store/index.ts << 'EOF'
// Stub file - Redux removed, use useApp() from context/AppContext instead
export const useStoreContext = () => {
  throw new Error('Redux removed - use useApp() from context/AppContext');
};
EOF

cat > src/store/hooks.ts << 'EOF'
// Stub file - Redux removed, use useApp() from context/AppContext instead
export const useAppSelector = () => {
  throw new Error('Redux removed - use useApp() from context/AppContext');
};
export const useAppDispatch = () => {
  throw new Error('Redux removed - use useApp() from context/AppContext');
};
EOF

echo "✓ Redux stubs created"
echo "✓ App should now be runnable (with errors in pages that haven't been updated)"
echo ""
echo "Next steps:"
echo "1. Update each page file to use useApp() instead of Redux"
echo "2. See COMPLETE_REDUX_REMOVAL_GUIDE.md for patterns"
echo "3. Once all files are updated, delete src/store directory completely"
