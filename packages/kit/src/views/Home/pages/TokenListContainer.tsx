import { memo, useCallback, useEffect } from 'react';

import axios, { CanceledError } from 'axios';

import type { ITabPageProps } from '@onekeyhq/components';
import {
  Portal,
  useMedia,
  useTabIsRefreshingFocused,
} from '@onekeyhq/components';
import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import {
  POLLING_DEBOUNCE_INTERVAL,
  POLLING_INTERVAL_FOR_TOKEN,
} from '@onekeyhq/shared/src/consts/walletConsts';
import {
  EModalAssetDetailRoutes,
  EModalRoutes,
} from '@onekeyhq/shared/src/routes';
import accountUtils from '@onekeyhq/shared/src/utils/accountUtils';
import type { IToken } from '@onekeyhq/shared/types/token';

import { TokenListView } from '../../../components/TokenListView';
import useAppNavigation from '../../../hooks/useAppNavigation';
import { useBuyToken } from '../../../hooks/useBuyToken';
import { usePromiseResult } from '../../../hooks/usePromiseResult';
import { useReceiveToken } from '../../../hooks/useReceiveToken';
import { useActiveAccount } from '../../../states/jotai/contexts/accountSelector';
import { useTokenListActions } from '../../../states/jotai/contexts/tokenList';
import { HomeTokenListProviderMirror } from '../components/HomeTokenListProvider/HomeTokenListProviderMirror';
import { UrlAccountHomeTokenListProviderMirror } from '../components/HomeTokenListProvider/UrlAccountHomeTokenListProviderMirror';
import { WalletActions } from '../components/WalletActions';
import { useAtom } from 'jotai';
import { myAccountAtom } from '../../../states/jotai/myAccountAtom';
import { ethers } from 'ethers';
import SimpleToken from '../../../../assets/SimpleToken.json';

function TokenListContainer({
  showWalletActions = false,
  ...props
}: ITabPageProps) {
  const { onContentSizeChange } = props;
  const { isFocused, isHeaderRefreshing, setIsHeaderRefreshing } =
    useTabIsRefreshingFocused();

  const {
    activeAccount: { account, network, wallet, deriveInfo, deriveType },
  } = useActiveAccount({ num: 0 });
  const [myAccount] = useAtom(myAccountAtom);

  const { handleOnBuy, isSupported } = useBuyToken({
    accountId: account?.id ?? '',
    networkId: network?.id ?? '',
  });
  const { handleOnReceive } = useReceiveToken({
    accountId: account?.id ?? '',
    networkId: network?.id ?? '',
    walletId: wallet?.id ?? '',
    deriveInfo,
    deriveType,
  });

  const media = useMedia();
  const navigation = useAppNavigation();

  const {
    refreshAllTokenList,
    refreshAllTokenListMap,
    refreshTokenList,
    refreshTokenListMap,
    refreshRiskyTokenList,
    refreshRiskyTokenListMap,
    refreshSmallBalanceTokenList,
    refreshSmallBalanceTokenListMap,
    refreshSmallBalanceTokensFiatValue,
    updateTokenListState,
    updateSearchKey,
  } = useTokenListActions().current;

  const getSTKBalance = async (tokenAddress: string) => {
    const provider = new ethers.providers.JsonRpcProvider(
      'https://rpc-x0sepolia-id058i99l1.t.conduit.xyz/',
    );

    const sentTokenContract = new ethers.Contract(
      tokenAddress,
      SimpleToken.abi,
      provider,
    );

    const balance = await sentTokenContract?.balanceOf(
      myAccount?.account_abstraction_address,
    );

    const stringBalance = ethers.utils.formatUnits(balance, 6);

    return stringBalance;
  };

  const { run } = usePromiseResult(
    async () => {
      try {
        if (!myAccount || !network) return;

        await backgroundApiProxy.serviceToken.abortFetchAccountTokens();
        const accountAddress = myAccount?.account_abstraction_address;
        // const accountAddress =
        //   await backgroundApiProxy.serviceAccount.getAccountAddressForApi({
        //     accountId: account.id,
        //     networkId: network.id,
        //   });
        if (network?.chainId === '170845') {
          const keys = '170845';
          const provider = new ethers.providers.JsonRpcProvider(
            'https://rpc-x0sepolia-id058i99l1.t.conduit.xyz/',
          );
          const balance = await provider.getBalance(accountAddress);
          const stringBalance = ethers.utils.formatEther(balance);

          const responseTokens = await axios.get(
            'https://straxapi.blockchainworks.id/api/tokens/',
          );
          const straxTokens: any[] = await Promise.all(
            responseTokens?.data?.data?.map(async (val) => {
              const balance = await getSTKBalance(val?.address);
              return {
                ...val,
                '$key': `evm-170845_0x42e19b59fa5632c01b87666a400a002a695251d2_${val?.address}`,
                'logoURI':
                  val.symbol === 'USDT'
                    ? 'https://seeklogo.com/images/T/tether-usdt-logo-FA55C7F397-seeklogo.com.png'
                    : 'https://uni.onekey-asset.com/static/chain/eth.png',
                balance: balance,
              };
            }),
          );

          const tokens = [
            {
              '$key':
                'evm--170845_0x42e19b59fa5632c01b87666a400a002a695251d2_0x0000000000000000000000000000000000000000',
              'address': '0x0000000000000000000000000000000000000000',
              'decimals': 6,
              'isNative': false,
              'logoURI': 'https://x0pay.com/images/logo-primary.png',
              'name': 'x0',
              'riskLevel': 1,
              'symbol': 'x0',
              'totalSupply': '',
            },
            ...straxTokens,
          ];

          const response = await axios.get(
            'https://straxapi.blockchainworks.id/api/exchanges/token-amount/' +
              1,
          );
          const tokenMap = tokens?.reduce((acc, token) => {
            // Create an entry in the accumulator object for each token

            acc[token['$key']] = {
              price: '0.0', // Default price, update with real value if available
              price24h: '0', // Default 24h price change, update if available
              balance: '0', // Default balance, update with real value if available
              balanceParsed: token['$key']?.includes(
                '0x0000000000000000000000000000000000000000',
              )
                ? stringBalance
                : token?.balance, // Default parsed balance, replace with the correct variable
              fiatValue: token['$key']?.includes(
                '0x0000000000000000000000000000000000000000',
              )
                ? Number(stringBalance) * Number(response?.data?.data?.price)
                : Number(token?.balance) * Number(response?.data?.data?.price), // Default fiat value, update with real value if available
              address: token?.address,
            };

            return acc; // Return the updated accumulator object
          }, {});

          refreshTokenList({ keys, tokens });
          refreshAllTokenList({
            keys,
            tokens,
          });
          refreshAllTokenListMap(tokenMap);
          const mergedTokens = tokens;
          if (mergedTokens && mergedTokens.length) {
            void backgroundApiProxy.serviceToken.updateLocalTokens({
              networkId: network.id,
              tokens: mergedTokens,
            });
          }
          updateTokenListState({
            initialized: true,
            isRefreshing: false,
          });
        } else {
          const blockedTokens =
            await backgroundApiProxy.serviceToken.getBlockedTokens({
              networkId: network.id,
            });

          const r = await backgroundApiProxy.serviceToken.fetchAccountTokens({
            mergeTokens: true,
            networkId: network.id,
            accountAddress,
            flag: 'home-token-list',
            // xpub: await backgroundApiProxy.serviceAccount.getAccountXpub({
            //   accountId: account.id,
            //   networkId: network.id,
            // }),
            blockedTokens: Object.keys(blockedTokens),
          });

          refreshTokenList({ keys: r.tokens.keys, tokens: r.tokens.data });
          refreshTokenListMap(r.tokens.map);
          refreshRiskyTokenList({
            keys: r.riskTokens.keys,
            riskyTokens: r.riskTokens.data,
          });
          refreshRiskyTokenListMap(r.riskTokens.map);
          refreshSmallBalanceTokenList({
            keys: r.smallBalanceTokens.keys,
            smallBalanceTokens: r.smallBalanceTokens.data,
          });
          refreshSmallBalanceTokenListMap(r.smallBalanceTokens.map);
          refreshSmallBalanceTokensFiatValue(
            r.smallBalanceTokens.fiatValue ?? '0',
          );

          if (r.allTokens) {
            refreshAllTokenList({
              keys: r.allTokens?.keys,
              tokens: r.allTokens?.data,
            });
            refreshAllTokenListMap(r.allTokens.map);
            const mergedTokens = r.allTokens.data;
            if (mergedTokens && mergedTokens.length) {
              void backgroundApiProxy.serviceToken.updateLocalTokens({
                networkId: network.id,
                tokens: mergedTokens,
              });
            }
            updateTokenListState({
              initialized: true,
              isRefreshing: false,
            });
          }
        }
      } catch (e) {
        if (e instanceof CanceledError) {
          console.log('fetchAccountTokens canceled');
        } else {
          throw e;
        }
      } finally {
        setIsHeaderRefreshing(false);
      }
    },
    [
      account,
      network,
      refreshTokenList,
      refreshTokenListMap,
      refreshRiskyTokenList,
      refreshRiskyTokenListMap,
      refreshSmallBalanceTokenList,
      refreshSmallBalanceTokenListMap,
      refreshSmallBalanceTokensFiatValue,
      refreshAllTokenList,
      refreshAllTokenListMap,
      updateTokenListState,
      setIsHeaderRefreshing,
    ],
    {
      overrideIsFocused: (isPageFocused) => isPageFocused && isFocused,
      debounced: POLLING_DEBOUNCE_INTERVAL,
      pollingInterval: POLLING_INTERVAL_FOR_TOKEN,
    },
  );
  useEffect(() => {
    if (isHeaderRefreshing) {
      void run();
    }
  }, [isHeaderRefreshing, run]);

  const { result: vaultSettings } = usePromiseResult(
    () =>
      backgroundApiProxy.serviceNetwork.getVaultSettings({
        networkId: network?.id ?? '',
      }),
    [network?.id],
  );

  useEffect(() => {
    if (account?.id && network?.id && wallet?.id) {
      updateTokenListState({
        initialized: false,
        isRefreshing: true,
      });
      updateSearchKey('');
    }
  }, [
    account?.id,
    network?.id,
    updateSearchKey,
    updateTokenListState,
    wallet?.id,
  ]);

  const handleOnPressToken = useCallback(
    (token: IToken) => {
      console.log(token, myAccount);
      if (!myAccount || !network || !wallet || !deriveInfo) return;
      navigation.pushModal(EModalRoutes.MainModal, {
        screen: EModalAssetDetailRoutes.TokenDetails,
        params: {
          // accountId: account.id,
          networkId: network.id,
          walletId: wallet.id,
          deriveInfo,
          deriveType,
          tokenInfo: token,
        },
      });
    },
    [account, deriveInfo, deriveType, navigation, network, wallet],
  );

  return (
    <>
      {showWalletActions ? (
        <Portal.Body container={Portal.Constant.WALLET_ACTIONS}>
          <WalletActions
            pt="$5"
            $gtLg={{
              pt: 0,
            }}
          />
        </Portal.Body>
      ) : null}
      <TokenListView
        withHeader
        withFooter
        withPrice
        withBuyAndReceive={!vaultSettings?.disabledSendAction}
        isBuyTokenSupported={isSupported}
        onBuyToken={handleOnBuy}
        onReceiveToken={handleOnReceive}
        onPressToken={handleOnPressToken}
        onContentSizeChange={onContentSizeChange}
        {...(media.gtLg && {
          tableLayout: true,
        })}
      />
    </>
  );
}

const TokenListContainerWithProvider = memo((props: ITabPageProps) => {
  const {
    activeAccount: { account },
  } = useActiveAccount({ num: 0 });
  const isUrlAccount = accountUtils.isUrlAccountFn({
    accountId: account?.id ?? '',
  });
  return isUrlAccount ? (
    <UrlAccountHomeTokenListProviderMirror>
      <TokenListContainer {...props} />
    </UrlAccountHomeTokenListProviderMirror>
  ) : (
    <HomeTokenListProviderMirror>
      <TokenListContainer showWalletActions {...props} />
    </HomeTokenListProviderMirror>
  );
});
TokenListContainerWithProvider.displayName = 'TokenListContainerWithProvider';

export { TokenListContainerWithProvider };
