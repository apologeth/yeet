import { useCallback } from 'react';

import type { IPageNavigationProp, IXStackProps } from '@onekeyhq/components';
import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { ReviewControl } from '@onekeyhq/kit/src/components/ReviewControl';
import useAppNavigation from '@onekeyhq/kit/src/hooks/useAppNavigation';
import { usePromiseResult } from '@onekeyhq/kit/src/hooks/usePromiseResult';
import { useActiveAccount } from '@onekeyhq/kit/src/states/jotai/contexts/accountSelector';
import {
  useAllTokenListAtom,
  useAllTokenListMapAtom,
  useTokenListStateAtom,
} from '@onekeyhq/kit/src/states/jotai/contexts/tokenList';
import type {
  IModalSendParamList,
  IModalSwapParamList,
} from '@onekeyhq/shared/src/routes';
import {
  EAssetSelectorRoutes,
  EModalRoutes,
  EModalSendRoutes,
  EModalSwapRoutes,
} from '@onekeyhq/shared/src/routes';
import timerUtils from '@onekeyhq/shared/src/utils/timerUtils';
import type { IToken } from '@onekeyhq/shared/types/token';

import { RawActions } from './RawActions';
import { WalletActionBuy } from './WalletActionBuy';
import { WalletActionMore } from './WalletActionMore';
import { WalletActionReceive } from './WalletActionReceive';
import { useAtom } from 'jotai';
import { myAccountAtom } from '../../../../states/jotai/myAccountAtom';

function WalletActionSend() {
  const navigation =
    useAppNavigation<IPageNavigationProp<IModalSendParamList>>();
  const {
    activeAccount: { account, network },
  } = useActiveAccount({ num: 0 });

  const [allTokens] = useAllTokenListAtom();
  const [map] = useAllTokenListMapAtom();
  const [tokenListState] = useTokenListStateAtom();

  const [myAccount] = useAtom(myAccountAtom);

  const vaultSettings = usePromiseResult(async () => {
    const settings = await backgroundApiProxy.serviceNetwork.getVaultSettings({
      networkId: network?.id ?? '',
    });
    return settings;
  }, [network?.id]).result;

  const handleOnSend = useCallback(async () => {
    console.log(myAccount, '\n', network, '\n', allTokens);
    if (!myAccount || !network) return;

    // if (vaultSettings?.isSingleToken) {
    //   const nativeToken = await backgroundApiProxy.serviceToken.getNativeToken({
    //     networkId: network.id,
    //     accountId: myAccount?.account_abstraction_address,
    //   });
    //   navigation.pushModal(EModalRoutes.SendModal, {
    //     screen: EModalSendRoutes.SendDataInput,
    //     params: {
    //       accountId: myAccount?.account_abstraction_address,
    //       networkId: network.id,
    //       isNFT: false,
    //       token: nativeToken,
    //     },
    //   });
    //   return;
    // }
    console.log(
      'ALL',
      allTokens.tokens?.filter(
        (val) => val?.address === '0xC3c5D2D5fB6b6FE9948aB94Ce94c018C2B663939',
      )[0],
    );
    navigation.pushModal(EModalRoutes.SendModal, {
      screen: EModalSendRoutes.SendDataInput,
      params: {
        accountId: account?.id,
        networkId: network.id,
        isNFT: false,
        token: allTokens.tokens?.filter(
          (val) =>
            val?.address === '0xC3c5D2D5fB6b6FE9948aB94Ce94c018C2B663939',
        )[0],
      },
    });
  }, [
    myAccount,
    account,
    allTokens.keys,
    allTokens.tokens,
    vaultSettings,
    map,
    navigation,
    network,
  ]);

  return (
    <RawActions.Send
      onPress={handleOnSend}
      // disabled={
      //   vaultSettings?.disabledSendAction || !tokenListState.initialized
      // }
    />
  );
}

function WalletActionPay() {
  const navigation =
    useAppNavigation<IPageNavigationProp<IModalSendParamList>>();
  const {
    activeAccount: { account, network },
  } = useActiveAccount({ num: 0 });

  const [allTokens] = useAllTokenListAtom();
  const [map] = useAllTokenListMapAtom();

  const [myAccount] = useAtom(myAccountAtom);

  const handleOnSend = useCallback(async () => {
    console.log(myAccount, '\n', network, '\n', allTokens);
    if (!myAccount || !network) return;

    navigation.pushModal(EModalRoutes.SendModal, {
      screen: EModalSendRoutes.SendDataInput,
      params: {
        accountId: account?.id,
        networkId: network.id,
        isNFT: false,
        token: allTokens.tokens?.filter(
          (val) =>
            val?.address === '0xC3c5D2D5fB6b6FE9948aB94Ce94c018C2B663939',
        )[0],
        type: 'fiat',
        isPay: true,
      },
    });
  }, [
    myAccount,
    account,
    allTokens.keys,
    allTokens.tokens,
    map,
    navigation,
    network,
  ]);

  return (
    <RawActions.Pay
      onPress={handleOnSend}
      // disabled={
      //   vaultSettings?.disabledSendAction || !tokenListState.initialized
      // }
    />
  );
}

function WalletActionSwap({ networkId }: { networkId?: string }) {
  const navigation =
    useAppNavigation<IPageNavigationProp<IModalSwapParamList>>();

  const {
    activeAccount: { account, network },
  } = useActiveAccount({ num: 0 });

  const [allTokens] = useAllTokenListAtom();
  const [map] = useAllTokenListMapAtom();

  const [myAccount] = useAtom(myAccountAtom);
  const vaultSettings = usePromiseResult(async () => {
    const settings = await backgroundApiProxy.serviceNetwork.getVaultSettings({
      networkId: networkId ?? '',
    });
    return settings;
  }, [networkId]).result;
  const handleOnSwap = useCallback(() => {
    navigation.pushModal(EModalRoutes.SwapModal, {
      screen: EModalSwapRoutes.SwapMainLand,
      params: { importNetworkId: networkId },
    });
  }, [navigation, networkId]);

  const handleOnSend = useCallback(async () => {
    console.log(myAccount, '\n', network, '\n', allTokens);
    if (!myAccount || !network) return;

    navigation.pushModal(EModalRoutes.SendModal, {
      screen: EModalSendRoutes.SendDataInput,
      params: {
        accountId: account?.id,
        networkId: network.id,
        isNFT: false,
        token: allTokens.tokens?.filter(
          (val) =>
            val?.address === '0xC3c5D2D5fB6b6FE9948aB94Ce94c018C2B663939',
        )[0],
        type: 'fiat',
        isBuy: true,
      },
    });
  }, [
    myAccount,
    account,
    allTokens.keys,
    allTokens.tokens,
    map,
    navigation,
    network,
  ]);

  return (
    <RawActions.Swap
      onPress={handleOnSend}
      // disabled={vaultSettings?.disabledSwapAction}
    />
  );
}

function WalletActions({ ...rest }: IXStackProps) {
  const {
    activeAccount: { network, account, wallet, deriveInfo, deriveType },
  } = useActiveAccount({ num: 0 });

  return (
    <RawActions {...rest}>
      <WalletActionSwap networkId={network?.id} />
      <ReviewControl>
        <WalletActionBuy networkId={network?.id} accountId={account?.id} />
      </ReviewControl>
      <WalletActionPay />
      <WalletActionSend />
      <WalletActionReceive
        accountId={account?.id}
        networkId={network?.id}
        walletId={wallet?.id}
        deriveInfo={deriveInfo}
        deriveType={deriveType}
      />
      {/* <WalletActionMore /> */}
    </RawActions>
  );
}

export { WalletActions };
