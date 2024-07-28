import { memo } from 'react';

import type { IXStackProps } from '@onekeyhq/components';
import { XStack, useMedia } from '@onekeyhq/components';
import { NetworkSelectorTriggerHome } from '@onekeyhq/kit/src/components/AccountSelector/NetworkSelectorTrigger';

type IProps = { createAddressDisabled?: boolean } & IXStackProps;

function HomeSelector(props: IProps) {
  const num = 0;

  const { createAddressDisabled, ...rest } = props;

  return (
    <XStack
      testID="Wallet-Address-Generator"
      alignItems="center"
      space="$3"
      {...rest}
    >
      <NetworkSelectorTriggerHome num={num} />
    </XStack>
  );
}

export default memo(HomeSelector);
