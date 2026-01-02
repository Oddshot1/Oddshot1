#!/bin/bash
# Deploy Polymarket Edge Functions to Supabase

echo "🚀 Deploying Polymarket Edge Functions..."

# Functions to deploy
FUNCTIONS=(
  "poly-geoblock"
  "poly-profile"
  "poly-balance"
  "poly-order"
  "poly-portfolio"
  "bridge-supported-assets"
  "bridge-deposit"
)

# Check if logged in
if ! supabase projects list > /dev/null 2>&1; then
  echo "❌ Not logged in to Supabase CLI"
  echo "Please run: supabase login"
  exit 1
fi

# Deploy each function
for func in "${FUNCTIONS[@]}"; do
  echo "📦 Deploying $func..."
  supabase functions deploy "$func" --no-verify-jwt
  
  if [ $? -eq 0 ]; then
    echo "✅ $func deployed successfully"
  else
    echo "❌ Failed to deploy $func"
  fi
done

echo ""
echo "🎉 All functions deployed!"
echo ""
echo "⚙️  Don't forget to set these secrets in Supabase Dashboard:"
echo "   - POLY_BUILDER_API_KEY"
echo "   - POLY_BUILDER_SECRET"
echo "   - POLY_BUILDER_PASSPHRASE"
echo "   - POLYGON_RPC_URL (optional, for poly-balance)"

