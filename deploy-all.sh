#!/bin/bash
# Complete Supabase Deployment Script
# Run this after setting your SUPABASE_ACCESS_TOKEN

echo "🚀 ODDSHOT Supabase Deployment"
echo "================================"
echo ""

# Check if token is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ Error: SUPABASE_ACCESS_TOKEN not set"
  echo ""
  echo "Get your token from: https://supabase.com/dashboard/account/tokens"
  echo "Then run: export SUPABASE_ACCESS_TOKEN='your-token-here'"
  echo ""
  exit 1
fi

echo "✅ Token found!"
echo ""

# Link to project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref xbwapzyivpqjvovcgnja

if [ $? -ne 0 ]; then
  echo "❌ Failed to link project"
  exit 1
fi

echo "✅ Project linked!"
echo ""

# Deploy Edge Functions
echo "📦 Deploying Edge Functions..."
echo ""

FUNCTIONS=(
  "poly-geoblock"
  "poly-profile"
  "poly-balance"
  "poly-order"
  "poly-portfolio"
  "bridge-supported-assets"
  "bridge-deposit"
)

for func in "${FUNCTIONS[@]}"; do
  echo "  📤 Deploying $func..."
  supabase functions deploy "$func" --no-verify-jwt
  
  if [ $? -eq 0 ]; then
    echo "  ✅ $func deployed"
  else
    echo "  ❌ $func failed"
  fi
  echo ""
done

echo "================================"
echo "🎉 Deployment Complete!"
echo ""
echo "⚠️  IMPORTANT: Set these secrets in Supabase Dashboard:"
echo "   Go to: https://supabase.com/dashboard/project/xbwapzyivpqjvovcgnja/settings/vault"
echo ""
echo "   Required secrets for poly-order:"
echo "   - POLY_BUILDER_API_KEY"
echo "   - POLY_BUILDER_SECRET"
echo "   - POLY_BUILDER_PASSPHRASE"
echo ""
echo "   Optional secrets:"
echo "   - POLYGON_RPC_URL (for poly-balance)"
echo ""
echo "================================"
echo ""
echo "🧪 Test your functions:"
echo "   curl https://xbwapzyivpqjvovcgnja.supabase.co/functions/v1/poly-geoblock \\"
echo "     -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid2FwenlpdnBxanZvdmNnbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzkwNTUsImV4cCI6MjA4MjE1NTA1NX0.fnYOZyoghdMTAK6-4juEbWMcfnkOlUEumQjHu3_tMsY'"
echo ""

