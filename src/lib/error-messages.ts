// Centralized error message parsing for user-friendly display
export interface ParsedError {
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
}

export function parsePolymarketError(error: unknown): ParsedError {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const lowerMsg = errorMsg.toLowerCase();

  // Insufficient balance errors
  if (lowerMsg.includes('insufficient') || lowerMsg.includes('not enough')) {
    if (lowerMsg.includes('lamports') || lowerMsg.includes('sol')) {
      return {
        title: 'Insufficient SOL Balance',
        description: 'You need more SOL in your wallet to complete this transaction. Please add funds and try again.',
        severity: 'error',
      };
    }
    if (lowerMsg.includes('usdc')) {
      return {
        title: 'Insufficient USDC Balance',
        description: 'You need more USDC to complete this trade. Fund your account in the Portfolio tab.',
        severity: 'error',
      };
    }
    return {
      title: 'Insufficient Funds',
      description: 'You don\'t have enough balance to complete this transaction. Please add funds and try again.',
      severity: 'error',
    };
  }

  // Authentication errors
  if (lowerMsg.includes('authentication failed') || lowerMsg.includes('invalid trading credentials') || lowerMsg.includes('invalid signature')) {
    return {
      title: 'Authentication Error',
      description: 'Your trading credentials are invalid. Please go to Portfolio and click "Enable Trading" again.',
      severity: 'error',
    };
  }

  if (lowerMsg.includes('auth') && (lowerMsg.includes('expired') || lowerMsg.includes('401') || lowerMsg.includes('403'))) {
    return {
      title: 'Session Expired',
      description: 'Your trading session has expired. Please reconnect your wallet and try again.',
      severity: 'warning',
    };
  }

  // User cancelled/rejected
  if (lowerMsg.includes('user rejected') || lowerMsg.includes('user cancelled') || lowerMsg.includes('user denied')) {
    return {
      title: 'Transaction Cancelled',
      description: 'You cancelled the transaction in your wallet.',
      severity: 'info',
    };
  }

  // Wallet not connected
  if (lowerMsg.includes('wallet not connected') || lowerMsg.includes('no wallet')) {
    return {
      title: 'Wallet Not Connected',
      description: 'Please connect your Phantom wallet to continue.',
      severity: 'warning',
    };
  }

  // EVM/Multichain required
  if (lowerMsg.includes('evm') || lowerMsg.includes('multichain')) {
    return {
      title: 'EVM Required',
      description: 'Please enable EVM/multichain in your Phantom wallet settings to trade on Polymarket.',
      severity: 'warning',
    };
  }

  // Geolocation/geoblock errors
  if (lowerMsg.includes('geo') || lowerMsg.includes('location') || lowerMsg.includes('region') || lowerMsg.includes('restricted')) {
    return {
      title: 'Region Restricted',
      description: 'Polymarket trading is not available in your region.',
      severity: 'error',
    };
  }

  // No USDC account
  if (lowerMsg.includes('no usdc') || lowerMsg.includes('account not found')) {
    return {
      title: 'No USDC Found',
      description: 'No USDC account found in your wallet. Please add USDC to your Solana wallet first.',
      severity: 'warning',
    };
  }

  // Minimum order size
  if (lowerMsg.includes('minimum') || lowerMsg.includes('too small') || lowerMsg.includes('below minimum')) {
    return {
      title: 'Order Too Small',
      description: 'Your order amount is below the minimum required. Please increase the amount and try again.',
      severity: 'warning',
    };
  }

  // Network/connection errors
  if (lowerMsg.includes('network') || lowerMsg.includes('connection') || lowerMsg.includes('timeout') || lowerMsg.includes('fetch failed')) {
    return {
      title: 'Network Error',
      description: 'Unable to connect to the server. Please check your internet connection and try again.',
      severity: 'error',
    };
  }

  // Rate limit
  if (lowerMsg.includes('rate limit') || lowerMsg.includes('too many requests')) {
    return {
      title: 'Too Many Requests',
      description: 'You\'re making requests too quickly. Please wait a moment and try again.',
      severity: 'warning',
    };
  }

  // Order already exists
  if (lowerMsg.includes('already exists') || lowerMsg.includes('duplicate')) {
    return {
      title: 'Duplicate Order',
      description: 'This order has already been placed. Check your order history.',
      severity: 'warning',
    };
  }

  // Slippage exceeded
  if (lowerMsg.includes('slippage') || lowerMsg.includes('price changed')) {
    return {
      title: 'Price Changed',
      description: 'The price moved too much while processing your order. Please try again with updated prices.',
      severity: 'warning',
    };
  }

  // Market not found / inactive
  if (lowerMsg.includes('market not found') || lowerMsg.includes('market closed') || lowerMsg.includes('inactive')) {
    return {
      title: 'Market Unavailable',
      description: 'This market is no longer available for trading.',
      severity: 'error',
    };
  }

  // Default fallback
  return {
    title: 'Transaction Failed',
    description: errorMsg.length > 100 ? errorMsg.substring(0, 100) + '...' : errorMsg,
    severity: 'error',
  };
}

export function parseFundingError(error: unknown, token: 'SOL' | 'USDC'): ParsedError {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const lowerMsg = errorMsg.toLowerCase();

  // Insufficient balance
  if (lowerMsg.includes('insufficient') || lowerMsg.includes('lamports')) {
    return {
      title: 'Insufficient Balance',
      description: `You don't have enough ${token} in your wallet. Please add funds and try again.`,
      severity: 'error',
    };
  }

  // No token account
  if (lowerMsg.includes('account not found') || lowerMsg.includes('no usdc')) {
    return {
      title: `No ${token} Account`,
      description: `No ${token} account found in your wallet. Please add ${token} to your Solana wallet first.`,
      severity: 'warning',
    };
  }

  // User cancelled
  if (lowerMsg.includes('user rejected') || lowerMsg.includes('cancelled')) {
    return {
      title: 'Transaction Cancelled',
      description: 'You cancelled the transaction in your wallet.',
      severity: 'info',
    };
  }

  // Minimum deposit
  if (lowerMsg.includes('minimum') || lowerMsg.includes('too low')) {
    return {
      title: 'Amount Too Low',
      description: errorMsg,
      severity: 'warning',
    };
  }

  // Default
  return {
    title: 'Transfer Failed',
    description: errorMsg,
    severity: 'error',
  };
}

export function parseGenericError(error: unknown): ParsedError {
  const errorMsg = error instanceof Error ? error.message : String(error);
  
  // Try Polymarket error parsing first
  return parsePolymarketError(error);
}

