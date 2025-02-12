import { TChain } from '@b0rza/gitcoin-chain-data';

export const customChains: TChain[] = [{
  // rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
  rpc: 'https://virtual.arbitrum-sepolia.rpc.tenderly.co/bd5d0ce2-fccd-45aa-b5a1-41ee94d12875',
  blockExplorer: 'https://sepolia.arbiscan.io/',
  name: 'sepolia',
  prettyName: 'Abitrum Sepolia',
  icon: 'https://sepolia.etherscan.io/images/logo.png',
  type: 'testnet',
  id: 421614,
  contracts: {
    multiRoundCheckout: '0x8e1bD5Da87C14dd8e08F7ecc2aBf9D1d558ea174',
    quadraticFunding: '0x787eC93Dd71a90563979417879F5a3298389227f',
    directGrants: '0x79A5EEc2C87Cd2116195E71af7A38647f89C8Ffa',
  },
  pricesFromTimestamp: 1667354777,
  tokens: [
    {
      code: 'EURMQ',
      address: '0x62316cceBc011eA559566579fC774437e3eb62d3',
      decimals: 18,
      canVote: true,
      priceSource: {
        chainId: 1,
        address: '0x62316cceBc011eA559566579fC774437e3eb62d3',
      },
      redstoneTokenId: 'EURMQ',
    },
    {
      code: 'USDC',
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      decimals: 6,
      canVote: true,
      priceSource: {
        chainId: 42161,
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      },
      redstoneTokenId: 'USDC',
    }
  ],
  subscriptions: [],
}];
