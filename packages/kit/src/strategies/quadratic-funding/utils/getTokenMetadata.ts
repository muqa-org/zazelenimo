import { TToken } from '@gitcoin/gitcoin-chain-data';
import { getContract, parseAbi, WalletClient } from 'viem';

import { TokenMetadata } from '../qf.types';

export const getTokenMetadata = async (token: TToken, walletClient: WalletClient): Promise<TokenMetadata> => {
  const erc20Contract = getContract({
    address: token.address,
    abi: parseAbi([
      'function nonces(address) public view returns (uint256)',
      'function decimals() public view returns (uint8)',
      'function name() public view returns (string)',
    ]),
    client: walletClient,
  });

  const owner = walletClient!.account!.address!;
  const nonce = await erc20Contract.read.nonces([owner]);
  const decimals = await erc20Contract.read.decimals();
  const name = await erc20Contract.read.name();

  return {
    name,
    decimals,
    address: token.address,
    nonce,
  }
};