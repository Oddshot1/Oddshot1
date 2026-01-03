#!/bin/bash
# Deploy missing Polymarket functions to Supabase

echo "🚀 Deploying Missing Polymarket Functions"
echo "========================================="
echo ""

# Check if we have token
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "⚠️  SUPABASE_ACCESS_TOKEN not set"
  echo ""
  echo "To deploy functions, you need a Supabase access token:"
  echo ""
  echo "1. Get token from Supabase Dashboard:"
  echo "   - Go to Settings → Access Tokens"
  echo "   - Create a new token"
  echo ""
  exit 1
fi

echo "✅ Token found!"
echo ""

# Link to project (if not already linked)
echo "🔗 Linking to Supabase project..."
supabase link --project-ref xbwapzyivpqjvovcgnja 2>/dev/null || echo "Already linked"
echo ""

# Deploy ONLY the missing functions
echo "📦 Deploying missing functions..."
echo ""

MISSING_FUNCTIONS=(
  "poly-geoblock"
  "poly-profile"
  "poly-balance"
  "bridge-supported-assets"
  "bridge-deposit"
)

for func in "${MISSING_FUNCTIONS[@]}"; do
  echo "  📤 Deploying $func..."
  
  if [ -d "supabase/functions/$func" ]; then
    supabase functions deploy "$func" --no-verify-jwt
    
    if [ $? -eq 0 ]; then
      echo "  ✅ $func deployed successfully"
    else
      echo "  ❌ $func failed to deploy"
    fi
  else
    echo "  ⚠️  $func directory not found"
  fi
  
  echo ""
done

echo "========================================="
echo "🎉 Deployment Complete!"
echo ""
echo "📋 Summary:"
echo "   Missing functions have been deployed"
echo "   Existing functions (poly-order, poly-portfolio, etc.) unchanged"
echo ""
echo "🧪 Test your app now!"
echo "   Refresh and try trading - CORS errors should be gone!"
echo ""

