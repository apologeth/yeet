/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable spellcheck/spell-checker */
import { memoFn } from '@onekeyhq/shared/src/utils/cacheUtils';
import type { IServerNetwork } from '@onekeyhq/shared/types';
import { ENetworkStatus } from '@onekeyhq/shared/types';

import platformEnv from '../platformEnv';

// dangerNetwork represents a virtual network
export const dangerAllNetworkRepresent: IServerNetwork = {
  'balance2FeeDecimals': 0,
  'chainId': '0',
  'code': '',
  'decimals': 0,
  'id': 'all--0',
  'impl': 'all',
  'isTestnet': false,
  'logoURI': 'https://uni.onekey-asset.com/static/chain/all.png',
  'name': 'All Networks',
  'shortcode': '',
  'shortname': '',
  'symbol': '',
  'feeMeta': {
    'code': '',
    'decimals': 0,
    'symbol': '0',
  },
  'defaultEnabled': true,
  'priceConfigs': [],
  'explorers': [],
  'status': ENetworkStatus.LISTED,
  'createdAt': '2023-05-31T00:29:24.951Z',
  'updatedAt': '2023-05-31T00:29:24.951Z',
};

export const getPresetNetworks = memoFn((): IServerNetwork[] => {
  const x0 = {
    'chainId': '170845',
    'code': 'x0',
    'id': 'evm--170845',
    'logoURI': 'https://uni.onekey-asset.com/static/chain/eth.png',
    'name': 'x0',
    'shortcode': 'x0',
    'shortname': 'x0',
    'feeMeta': {
      'code': 'x0',
      'decimals': 9,
      'symbol': 'ETH',
    },
    'rpcURLs': [
      {
        'url': 'https://rpc-x0sepolia-id058i99l1.t.conduit.xyz',
      },
    ],
    'rpcUrl': 'https://rpc-x0sepolia-id058i99l1.t.conduit.xyz',
    'explorers': [
      {
        'address': 'https://explorer-x0sepolia-id058i99l1.t.conduit.xyz',
        'block': 'https://explorer-x0sepolia-id058i99l1.t.conduit.xyz',
        'name': 'https://explorer-x0sepolia-id058i99l1.t.conduit.xyz',
        'transaction': 'https://explorer-x0sepolia-id058i99l1.t.conduit.xyz',
      },
    ],
    'priceConfigs': [
      {
        'channel': 'coingecko',
        'native': 'ethereum',
        'platform': 'ethereum',
      },
    ],
    'symbol': 'ETH',
    'decimals': 18,
    'balance2FeeDecimals': 9,
    'impl': 'evm',
    'isTestnet': true,
    'defaultEnabled': true,
    'status': ENetworkStatus.LISTED,
    'createdAt': '2023-08-10T00:29:24.951Z',
    'updatedAt': '2023-08-10T00:29:24.951Z',
    enabled: true,
    feeSymbol: 'Gwei',
  };

  const arb: IServerNetwork = {
    'balance2FeeDecimals': 9,
    'chainId': '42161',
    'code': 'arbitrum',
    'decimals': 18,
    'extensions': {
      'defaultStableTokens': [
        '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
        '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
      ],
      'position': 7,
    },
    'id': 'evm--42161',
    'impl': 'evm',
    'isTestnet': false,
    'logoURI': 'https://uni.onekey-asset.com/static/chain/arbitrum.png',
    'name': 'Arbitrum',
    'shortcode': 'arbitrum',
    'shortname': 'Arbitrum',
    'symbol': 'ETH',
    'feeMeta': {
      'code': 'arbitrum',
      'decimals': 9,
      'symbol': 'Gwei',
    },
    'defaultEnabled': true,
    'priceConfigs': [
      {
        'channel': 'coingecko',
        'native': 'ethereum',
        'platform': 'arbitrum-one',
      },
      {
        'channel': 'yahoo',
        'native': 'ETH',
      },
    ],
    'explorers': [
      {
        'address': 'https://arbiscan.io/address/{address}',
        'block': 'https://arbiscan.io/block/{block}',
        'name': 'https://arbiscan.io/',
        'transaction': 'https://arbiscan.io/tx/{transaction}',
      },
    ],
    'status': ENetworkStatus.LISTED,
    'createdAt': '2023-05-31T00:29:24.951Z',
    'updatedAt': '2023-05-31T00:29:24.951Z',
  };

  const sepolia: IServerNetwork = {
    'balance2FeeDecimals': 9,
    'chainId': '11155111',
    'code': 'sepolia',
    'decimals': 18,
    'extensions': {
      'providerOptions': {
        'EIP1559Enabled': true,
        'preferMetamask': true,
      },
    },
    'id': 'evm--11155111',
    'impl': 'evm',
    'isTestnet': true,
    'logoURI':
      'https://uni.onekey-asset.com/static/chain/ethereum-sepolia-testnet.png',
    'name': 'Ethereum Sepolia Testnet',
    'shortcode': 'sepolia',
    'shortname': 'Sepolia',
    'symbol': 'TETH',
    'feeMeta': {
      'code': 'sepolia',
      'decimals': 9,
      'symbol': 'Gwei',
    },
    'defaultEnabled': false,
    'priceConfigs': [],
    'explorers': [
      {
        'address': 'https://sepolia.etherscan.io/address/{address}',
        'block': 'https://sepolia.etherscan.io/block/{block}',
        'name': 'https://sepolia.etherscan.io/',
        'transaction': 'https://sepolia.etherscan.io/tx/{transaction}',
      },
    ],
    'status': ENetworkStatus.LISTED,
    'createdAt': '2023-05-31T00:29:24.951Z',
    'updatedAt': '2023-05-31T00:29:24.951Z',
  };

  const chainsOnlyEnabledInDev = [];

  return [
    // btc & btc fork

    arb,
    sepolia,
    x0,
    // ...(platformEnv.isDev ? chainsOnlyEnabledInDev : []),
  ];
});
