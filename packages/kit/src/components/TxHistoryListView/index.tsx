import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';

import { useIntl } from 'react-intl';

import {
  ListView,
  SectionList,
  SizableText,
  Stack,
  XStack,
} from '@onekeyhq/components';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import { formatDate } from '@onekeyhq/shared/src/utils/dateUtils';
import { getFilteredHistoryBySearchKey } from '@onekeyhq/shared/src/utils/historyUtils';
import type { IAccountHistoryTx } from '@onekeyhq/shared/types/history';
import { EDecodedTxStatus } from '@onekeyhq/shared/types/tx';

import { useSearchKeyAtom } from '../../states/jotai/contexts/historyList';
import { EmptySearch } from '../Empty';
import { EmptyHistory } from '../Empty/EmptyHistory';
import { HistoryLoadingView } from '../Loading';

import { TxHistoryListHeader } from './TxHistoryListHeader';
import { TxHistoryListItem } from './TxHistoryListItem';
import axios from 'axios';
import { useAtom } from 'jotai';
import { myAccountAtom } from '../../states/jotai/myAccountAtom';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from 'react-native';
import { SizableStack } from 'tamagui';
import moment from 'moment';
import TxHistoryModal from './TxHistoryModal';

type IProps = {
  data: IAccountHistoryTx[];
  isLoading?: boolean;
  onContentSizeChange?: ((w: number, h: number) => void) | undefined;
  tableLayout?: boolean;
  ListHeaderComponent?: ReactElement;
  showHeader?: boolean;
  showIcon?: boolean;
  onPressHistory?: (history: IAccountHistoryTx) => void;
  initialized?: boolean;
};

const ListFooterComponent = () => <Stack h="$5" />;

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    display: 'flex',
    flex: 1,
    height: 300,
  },
  containerLoading: {
    paddingTop: 20,
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  item: {
    padding: 20,
    fontSize: 15,
    marginTop: 5,
  },
});

function TxHistoryListView(props: IProps) {
  const intl = useIntl();
  const {
    data,
    isLoading,
    showHeader,
    ListHeaderComponent,
    showIcon,
    onPressHistory,
    tableLayout,
    onContentSizeChange,
    initialized,
  } = props;

  const currentDate = useRef('');
  const [searchKey] = useSearchKeyAtom();
  const [myAccount] = useAtom(myAccountAtom);
  const [loading, setLoading] = useState(false);
  const [historySent, setHistorySent] = useState();
  const [historyReceived, setHistoryReceived] = useState();
  const [allHistory, setAllHistory] = useState([]);

  const filteredHistory = getFilteredHistoryBySearchKey({
    history: data,
    searchKey,
  });

  const getDataHistory = async (limit: number) => {
    try {
      setLoading(true);
      console.log(myAccount?.access_token);
      const responseSent = await axios.get(
        `https://mainnet.yeetpay.id/api/transaction-history/sent?limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${myAccount?.access_token}`,
          },
        },
      );

      const responseReceived = await axios.get(
        `https://mainnet.yeetpay.id/api/transaction-history/received?limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${myAccount?.access_token}`,
          },
        },
      );
      console.log(responseReceived.data);

      if (responseSent.status === 200 || responseReceived.status === 200) {
        const newAllHistory = responseSent.data.data
          .concat(responseReceived.data.data)
          .sort((a, b) => b.created_at - a.created_at);

        setHistorySent(responseSent.data);
        setHistoryReceived(responseReceived.data);
        setAllHistory(newAllHistory);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDataHistory(100000);
  }, []);

  const renderTransferType = (
    transferType: string,
    type: string,
    isReceiver: bool,
  ) => {
    if (type === 'BUY_TOKEN' && transferType === null) {
      return 'Buy';
    } else if (type === 'WITHDRAW' && transferType === null) {
      return 'Withdraw';
    } else if (type === 'TOP_UP' && transferType === null) {
      return 'Top Up';
    } else if (
      (type === 'TRANSFER' && transferType === 'NATIVE_TO_NATIVE') ||
      (type === 'TRANSFER' && transferType === 'CRYPTO_TO_CRYPTO')
    ) {
      if (isReceiver) {
        return 'Receive';
      }
      return 'Send';
    } else if (
      (type === 'TRANSFER' && transferType === 'NATIVE_TO_FIAT') ||
      (type === 'TRANSFER' && transferType === 'CRYPTO_TO_FIAT')
    ) {
      return 'Pay';
    } else {
      return '-';
    }
  };

  const renderIcon = (symbol: string) => {
    if (symbol === 'x0') {
      return 'https://x0pay.com/images/logo-primary.png';
    } else if (symbol === 'Tether USD') {
      return 'https://seeklogo.com/images/T/tether-usdt-logo-FA55C7F397-seeklogo.com.png';
    } else {
      return 'https://uni.onekey-asset.com/static/chain/eth.png';
    }
  };

  if (allHistory.length === 0) {
    if (loading) {
      return (
        <View style={styles.containerLoading}>
          <Stack py="$3">
            <SizableText>Loading...</SizableText>
          </Stack>
        </View>
      );
    }
    return <EmptyHistory />;
  }

  return (
    <View style={styles.container}>
      <ScrollView nestedScrollEnabled={true}>
        {allHistory.map((history) => {
          return (
            <TxHistoryModal data={history}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  paddingHorizontal: 10,
                  marginBottom: 20,
                  width: '100%',
                  justifyContent: 'space-between',
                }}
              >
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <Image
                    style={{ width: 24, height: 24, marginRight: 10 }}
                    source={{
                      uri: renderIcon(history.token.symbol),
                    }}
                  />
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        flex: 1,
                      }}
                    >
                      <SizableText size="$bodyLgMedium">
                        {renderTransferType(
                          history.transfer_type,
                          history.type,
                          history.hasOwnProperty('receiver') || false,
                        )}
                      </SizableText>
                      <SizableText
                        size="$bodyLgMedium"
                        // color="#3c9b69"
                        textAlign="right"
                        style={{ fontWeight: 'bold' }}
                      >
                        {history.amount}
                      </SizableText>
                    </View>
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        flex: 1,
                      }}
                    >
                      <SizableText color="$textSubdued" size="$bodyMd">
                        {moment(history.created_at).format(
                          moment(history.created_at)
                            .calendar()
                            .includes('Today')
                            ? 'hh:mm a'
                            : 'ddd, DD MMM YY',
                        )}
                      </SizableText>
                      <SizableText
                        size="$bodyMd"
                        color="$textSubdued"
                        textAlign="right"
                      >
                        Rp {history.fiat_amount || '0'}
                      </SizableText>
                    </View>
                  </View>
                </View>
              </View>
            </TxHistoryModal>
          );
        })}
      </ScrollView>
    </View>
  );
}

export { TxHistoryListView };
