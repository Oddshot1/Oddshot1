// ODDSHOT Polymarket Funding Hook
// Handles deposit address creation and Solana transfers
import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// USDC mint address on Solana
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

interface SupportedAssets {
  chains: any[];
  minCheckoutUsd: number;
}

interface DepositAddress {
  svmDepositAddress: string;
  note?: string;
}

interface UseFundingReturn {
  supportedAssets: SupportedAssets | null;
  depositAddress: DepositAddress | null;
  isCreatingAddress: boolean;
  isSending: boolean;
  error: string | null;
  getSupportedAssets: () => Promise<void>;
  createDepositAddress: (proxyWallet: string) => Promise<void>;
  sendSOL: (amount: number) => Promise<string>;
  sendUSDC: (amount: number) => Promise<string>;
}

export function usePolymarketFunding(): UseFundingReturn {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  
  const [supportedAssets, setSupportedAssets] = useState<SupportedAssets | null>(null);
  const [depositAddress, setDepositAddress] = useState<DepositAddress | null>(null);
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get supported assets and minimum deposit
  const getSupportedAssets = useCallback(async () => {
    setError(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bridge-supported-assets`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch supported assets: ${response.statusText}`);
      }

      const data = await response.json();
      setSupportedAssets(data);
    } catch (err) {
      console.error('[useFunding] Error fetching supported assets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch supported assets');
    }
  }, []);

  // Create deposit address for user's proxy wallet
  const createDepositAddress = useCallback(async (proxyWallet: string) => {
    setIsCreatingAddress(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bridge-deposit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ proxyWallet }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create deposit address: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.svmDepositAddress) {
        throw new Error('No Solana deposit address returned');
      }

      setDepositAddress(data);
      return data;
    } catch (err) {
      console.error('[useFunding] Error creating deposit address:', err);
      setError(err instanceof Error ? err.message : 'Failed to create deposit address');
      throw err;
    } finally {
      setIsCreatingAddress(false);
    }
  }, []);

  // Send SOL to deposit address
  const sendSOL = useCallback(async (amount: number): Promise<string> => {
    if (!publicKey || !depositAddress) {
      throw new Error('Wallet not connected or no deposit address');
    }

    setIsSending(true);
    setError(null);

    try {
      // ✅ CHECK BALANCE BEFORE SENDING
      const balance = await connection.getBalance(publicKey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;
      const requiredLamports = Math.floor(amount * LAMPORTS_PER_SOL);
      const estimatedFee = 5000; // ~0.000005 SOL
      const totalRequired = requiredLamports + estimatedFee;
      
      console.log(`[sendSOL] Balance check: ${balanceSOL.toFixed(4)} SOL available, need ${(totalRequired / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      
      if (balance < totalRequired) {
        throw new Error(` Insufficient SOL - You have ${balanceSOL.toFixed(4)} SOL but need ${(totalRequired / LAMPORTS_PER_SOL).toFixed(4)} SOL (including fees).`);
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(depositAddress.svmDepositAddress),
          lamports: requiredLamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      return signature;
    } catch (err) {
      console.error('[useFunding] Error sending SOL:', err);
      
      // Parse error message for user-friendly display
      let message = 'Failed to send SOL';
      
      if (err instanceof Error) {
        const errorMsg = err.message.toLowerCase();
        
        // Check for insufficient balance errors (multiple formats)
        if (errorMsg.includes('insufficient') || 
            errorMsg.includes('lamports') ||
            errorMsg.includes('custom program error: 1') ||
            errorMsg.includes('instruction #1 failed') ||
            errorMsg.includes('program error')) {
          message = `Insufficient SOL - You don't have enough SOL. You need at least ${amount.toFixed(4)} SOL plus fees (~0.005 SOL).`;
        } else if (errorMsg.includes('user rejected') || errorMsg.includes('user cancelled')) {
          message = 'Transaction cancelled by user';
        } else {
          message = err.message;
        }
      }
      
      setError(message);
      throw new Error(message);
    } finally {
      setIsSending(false);
    }
  }, [publicKey, depositAddress, sendTransaction, connection]);

  // Send USDC to deposit address
  const sendUSDC = useCallback(async (amount: number): Promise<string> => {
    if (!publicKey || !depositAddress) {
      throw new Error('Wallet not connected or no deposit address');
    }

    setIsSending(true);
    setError(null);

    try {
      // Get user's USDC token account
      const userUSDCAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        publicKey
      );

      // ✅ CHECK USDC BALANCE BEFORE SENDING
      try {
        const accountInfo = await connection.getTokenAccountBalance(userUSDCAccount);
        const balanceUSDC = parseFloat(accountInfo.value.uiAmount?.toString() || '0');
        
        console.log(`[sendUSDC] Balance check: ${balanceUSDC.toFixed(2)} USDC available, need ${amount.toFixed(2)} USDC`);
        
        if (balanceUSDC < amount) {
          throw new Error(`Insufficient USDC - You have ${balanceUSDC.toFixed(2)} USDC but need ${amount.toFixed(2)} USDC.`);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('could not find account')) {
          throw new Error('No USDC Account - No USDC found in your wallet. Please add USDC to your Solana wallet first.');
        }
        throw err;
      }

      // Get destination USDC token account
      const destUSDCAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        new PublicKey(depositAddress.svmDepositAddress)
      );

      // USDC has 6 decimals
      const usdcAmount = Math.floor(amount * 1e6);

      const transaction = new Transaction().add(
        createTransferInstruction(
          userUSDCAccount,
          destUSDCAccount,
          publicKey,
          usdcAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      return signature;
    } catch (err) {
      console.error('[useFunding] Error sending USDC:', err);
      
      // Parse error message for user-friendly display
      let message = 'Failed to send USDC';
      
      if (err instanceof Error) {
        const errorMsg = err.message.toLowerCase();
        
        // Check for insufficient balance errors (multiple formats)
        if (errorMsg.includes('insufficient') || 
            errorMsg.includes('not enough') ||
            errorMsg.includes('custom program error: 1') ||
            errorMsg.includes('instruction #1 failed') ||
            errorMsg.includes('program error')) {
          message = `Insufficient USDC - You don't have enough USDC. You need at least ${amount.toFixed(2)} USDC in your Solana wallet.`;
        } else if (errorMsg.includes('account not found') || errorMsg.includes('invalid account')) {
          message = 'No USDC Account - No USDC found in your wallet. Please add USDC to your Solana wallet first.';
        } else if (errorMsg.includes('user rejected') || errorMsg.includes('user cancelled')) {
          message = 'Transaction cancelled by user';
        } else {
          message = err.message;
        }
      }
      
      setError(message);
      throw new Error(message);
    } finally {
      setIsSending(false);
    }
  }, [publicKey, depositAddress, sendTransaction, connection]);

  return {
    supportedAssets,
    depositAddress,
    isCreatingAddress,
    isSending,
    error,
    getSupportedAssets,
    createDepositAddress,
    sendSOL,
    sendUSDC,
  };
}

