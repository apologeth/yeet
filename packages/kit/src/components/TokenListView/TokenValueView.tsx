import { useMemo } from 'react';

import type { ISizableTextProps } from '@onekeyhq/components';
import { NumberSizeableText } from '@onekeyhq/components';
import { useSettingsPersistAtom } from '@onekeyhq/kit-bg/src/states/jotai/atoms';

import {
  useAllTokenListMapAtom,
  useTokenListMapAtom,
} from '../../states/jotai/contexts/tokenList';

type IProps = {
  $key: string;
} & ISizableTextProps;

function TokenValueView(props: IProps) {
  const { $key, value, ...rest } = props;
  const [settings] = useSettingsPersistAtom();
  const [tokenListMap] = useTokenListMapAtom();
  const [allToken] = useAllTokenListMapAtom();
  const token = tokenListMap[$key];

  const content = useMemo(
    () => (
      <NumberSizeableText
        formatter="value"
        formatterOptions={{ currency: settings.currencyInfo.symbol }}
        {...rest}
      >
        {value || token?.fiatValue || allToken[$key]?.fiatValue || 0}
      </NumberSizeableText>
    ),
    [rest, settings.currencyInfo.symbol, token?.fiatValue],
  );
  return content;
}

export { TokenValueView };
