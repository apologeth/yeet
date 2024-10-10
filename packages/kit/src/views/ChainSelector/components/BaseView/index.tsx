import { useIntl } from 'react-intl';

import { Empty, ListView, Stack, View, XStack } from '@onekeyhq/components';
import { ListItem } from '@onekeyhq/kit/src/components/ListItem';
import {
  AllNetworksAvatar,
  NetworkAvatar,
} from '@onekeyhq/kit/src/components/NetworkAvatar';
import { dangerAllNetworkRepresent } from '@onekeyhq/shared/src/config/presetNetworks';
import { ETranslations } from '@onekeyhq/shared/src/locale';

import type { IServerNetworkMatch } from '../../types';
import { Text } from 'tamagui';
import backgroundApiProxy from '../../../../background/instance/backgroundApiProxy';
import { memo, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import SimpleToken from '../../../../../assets/SimpleToken.json';
import axios from 'axios';
import { TokenValueView } from '../../../../components/TokenListView/TokenValueView';
import { TokenBalanceView } from '../../../../components/TokenListView/TokenBalanceView';
import { TokenNameView } from '../../../../components/TokenListView/TokenNameView';
import { Token } from '../../../../components/Token';
import { withTokenListProvider } from '../../../../states/jotai/contexts/tokenList';
import { ActivityIndicator, Modal } from 'react-native';

const ListEmptyComponent = () => {
  const intl = useIntl();
  return (
    <Empty
      icon="SearchOutline"
      title={intl.formatMessage({
        id: ETranslations.global_no_results,
      })}
    />
  );
};

export type IBaseListViewProps = {
  networks: IServerNetworkMatch[];
  onPressItem?: (item: IServerNetworkMatch) => void;
  networkId?: string;
};

const ListItemReal = ({ item, onPressItem, networkId, address }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (address) {
      getData();
    }
  }, [address]);

  const getSTKBalance = async (tokenAddress: string, accAddress: string) => {
    const provider = new ethers.providers.JsonRpcProvider(
      'https://rpc-x0sepolia-id058i99l1.t.conduit.xyz/',
    );

    const sentTokenContract = new ethers.Contract(
      tokenAddress,
      SimpleToken.abi,
      provider,
    );

    const balance = await sentTokenContract?.balanceOf(accAddress);

    const stringBalance = ethers.utils.formatUnits(balance, 6);

    return stringBalance;
  };

  const getData = async () => {
    setLoading(true);

    let r = {};
    if (item?.chainId !== '170845') {
      try {
        const blockedTokens =
          await backgroundApiProxy.serviceToken.getBlockedTokens({
            networkId: item?.id,
          });

        r = await backgroundApiProxy.serviceToken.fetchAccountTokens({
          mergeTokens: true,
          networkId: item?.id,
          accountAddress: address,
          flag: 'home-token-list',
          // xpub: await backgroundApiProxy.serviceAccount.getAccountXpub({
          //   accountId: account.id,
          //   networkId: network.id,
          // }),
          blockedTokens: Object.keys(blockedTokens),
        });

        setData(r?.tokens?.data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          'https://rpc-x0sepolia-id058i99l1.t.conduit.xyz/',
        );
        const balance = await provider.getBalance(address);
        const stringBalance = ethers.utils.formatEther(balance);

        const responseTokens = await axios.get(
          'https://langitapi.blockchainworks.id/api/tokens/',
        );
        const langitTokens: any[] = await Promise.all(
          responseTokens?.data?.data?.map(async (val) => {
            const balance = await getSTKBalance(val?.address, address);
            return {
              ...val,
              '$key': `evm-170845_0x42e19b59fa5632c01b87666a400a002a695251d2_${val?.address}`,
              'logoURI': 'https://uni.onekey-asset.com/static/chain/eth.png',
              balance: balance,
            };
          }),
        );

        let tokens = [
          {
            '$key':
              'evm--170845_0x42e19b59fa5632c01b87666a400a002a695251d2_0x0000000000000000000000000000000000000000',
            'address': '0x0000000000000000000000000000000000000000',
            'decimals': 6,
            'isNative': false,
            'logoURI': 'https://uni.onekey-asset.com/static/chain/eth.png',
            'name': 'x0',
            'riskLevel': 1,
            'symbol': 'x0',
            'totalSupply': '',
          },
          ...langitTokens,
        ];

        const response = await axios.get(
          'https://langitapi.blockchainworks.id/api/exchanges/token-amount/' +
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

        r = {
          data: tokens.map((token) => ({
            ...token,
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
          })),
          map: tokenMap,
          keys: item?.chainId,
        };
console.log("asd", r?.data)
        setData(r?.data);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
  };
  return (
    <View>
      <Modal transparent visible={loading}>
        <View
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator />
        </View>
      </Modal>
      <ListItem
        h={48}
        renderAvatar={
          item.id === dangerAllNetworkRepresent.id ? (
            <AllNetworksAvatar size="$8" />
          ) : (
            <NetworkAvatar networkId={item?.id} size="$8" />
          )
        }
        title={item?.name}
        titleMatch={item.titleMatch}
        onPress={() => onPressItem?.(item)}
        testID={`select-item-${item.id}`}
      >
        {/* {networkId === item.id ? (
          <ListItem.CheckMark
            key="checkmark"
            enterStyle={{
              opacity: 0,
              scale: 0,
            }}
          />
        ) : null} */}
      </ListItem>
      {data?.map((token) => {
        return (
          <View
            key={token?.name}
            paddingLeft={60}
            paddingVertical={8}
            paddingRight={40}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            gap={8}
          >
            <Token size={'md'} tokenImageUri={token.logoURI} />
            <Stack flexGrow={1} flexBasis={0}>
              <XStack>
                <TokenNameView
                  size="$bodyLgMedium"
                  numberOfLines={1}
                  name={token.name}
                  isNative={token.isNative}
                />
              </XStack>
              <TokenBalanceView
                size="$bodyMd"
                color="$textSubdued"
                $key={token.$key ?? ''}
                value={token?.balanceParsed}
                symbol={token.symbol}
              />
            </Stack>

            <Stack flexDirection="column-reverse" alignItems="flex-end">
              <TokenValueView
                value={token?.fiatValue}
                $key={token.$key ?? ''}
                size="$bodyLgMedium"
                textAlign="right"
              />
            </Stack>
          </View>
        );
      })}
    </View>
  );
};

const ListItemRealWithProvider = memo(withTokenListProvider(ListItemReal));

export const BaseListView = ({
  networks,
  onPressItem,
  networkId,
  address,
}: IBaseListViewProps) => {
  return (
    <ListView
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={<Stack h="$2" />}
      estimatedItemSize={48}
      data={networks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ListItemRealWithProvider
          item={item}
          onPressItem={onPressItem}
          networkId={networkId}
          address={address}
        />
      )}
    />
  );
};
