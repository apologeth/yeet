import { useBuyToken } from '@onekeyhq/kit/src/hooks/useBuyToken';

import { RawActions } from './RawActions';
import { useAccountSelectorTrigger } from '../../../../components/AccountSelector/hooks/useAccountSelectorTrigger';

type IProps = {
  networkId: string | undefined;
  accountId: string | undefined;
};

export function WalletActionBuy(props: IProps) {
  const { networkId, accountId } = props;
  const { isSupported, handleOnBuy } = useBuyToken({
    networkId: networkId ?? '',
    accountId: accountId ?? '',
  });
  const {
    activeAccount: { account, dbAccount, indexedAccount, accountName, wallet },
    showAccountSelector,
  } = useAccountSelectorTrigger({ num: 0 });

  return (
    <RawActions.Buy
      onPress={showAccountSelector}
      // disabled={!isSupported}
      disabled={false}
    />
  );
}
