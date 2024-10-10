import { useMemo } from 'react';

import type { ISizableTextProps } from '@onekeyhq/components';
import { NumberSizeableText } from '@onekeyhq/components';

import {
  useAllTokenListAtom,
  useAllTokenListMapAtom,
  useTokenListMapAtom,
} from '../../states/jotai/contexts/tokenList';

type IProps = {
  $key: string;
  symbol: string;
} & ISizableTextProps;

function TokenBalanceView(props: IProps) {
  const { $key, symbol, value, ...rest } = props;
  const [tokenListMap] = useTokenListMapAtom();
  const [allToken] = useAllTokenListMapAtom();
  const token = tokenListMap[$key || ''];

  const content = useMemo(
    () => (
      <NumberSizeableText
        formatter="balance"
        formatterOptions={{ tokenSymbol: symbol }}
        {...rest}
      >
        {value || token?.balanceParsed || allToken[$key]?.balanceParsed || '0'}
      </NumberSizeableText>
    ),
    [rest, symbol, token?.balanceParsed],
  );
  return content;
}

export { TokenBalanceView };
