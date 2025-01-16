import { memo, useCallback, useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';

import {
  Button,
  Icon,
  IconButton,
  Skeleton,
  Stack,
  useClipboard,
  XStack,
} from '@onekeyhq/components';
import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { TxActionsListView } from '@onekeyhq/kit/src/components/TxActionListView';
import { useAccountData } from '@onekeyhq/kit/src/hooks/useAccountData';
import { usePromiseResult } from '@onekeyhq/kit/src/hooks/usePromiseResult';
import {
  useNativeTokenInfoAtom,
  useNativeTokenTransferAmountToUpdateAtom,
  useSendConfirmActions,
  useSendSelectedFeeInfoAtom,
  useUnsignedTxsAtom,
} from '@onekeyhq/kit/src/states/jotai/contexts/sendConfirm';
import { getMaxSendFeeUpwardAdjustmentFactor } from '@onekeyhq/kit/src/utils/gasFee';
import type { ITransferPayload } from '@onekeyhq/kit-bg/src/vaults/types';
import {
  calculateNativeAmountInActions,
  isSendNativeTokenAction,
} from '@onekeyhq/shared/src/utils/txActionUtils';
import { ETxActionComponentType } from '@onekeyhq/shared/types';

import {
  InfoItem,
  InfoItemGroup,
} from '../../../AssetDetails/pages/HistoryDetails/components/TxDetailsInfoItem';
import { Image, Text, View } from 'tamagui';
import axios from 'axios';
import {
  ActivityIndicator,
  Linking,
  Modal,
  TouchableOpacity,
} from 'react-native';
import LogoBCA from '@onekeyhq/kit/assets/bca.webp';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import useAppNavigation from '../../../../hooks/useAppNavigation';

type IProps = {
  accountId: string;
  networkId: string;
  transferPayload?: ITransferPayload;
};

function TxActionsContainer(props: IProps) {
  const { accountId, networkId, transferPayload } = props;
  const {
    updateNativeTokenTransferAmount,
    updateNativeTokenTransferAmountToUpdate,
  } = useSendConfirmActions().current;
  const [unsignedTxs] = useUnsignedTxsAtom();
  const [nativeTokenTransferAmountToUpdate] =
    useNativeTokenTransferAmountToUpdateAtom();
  const [nativeTokenInfo] = useNativeTokenInfoAtom();
  const [sendSelectedFeeInfo] = useSendSelectedFeeInfoAtom();
  const [isSendNativeToken, setIsSendNativeToken] = useState(false);
  const { vaultSettings } = useAccountData({ networkId });

  const navigation = useAppNavigation();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [transactionHash, setTransactionHash] = useState('');

  const { copyText } = useClipboard();

  useEffect(() => {
    if (transferPayload?.data?.transaction_id) {
      let trxInterval;
      const getTrxProcess = async () => {
        const responseTrx = await axios.get(
          'https://mainnet.yeetpay.id/api/transactions/' +
            transferPayload?.data?.transaction_id,
        );
        console.log('RESSSS', transferPayload, responseTrx?.data?.data);
        setData(responseTrx?.data?.data);
        if (responseTrx?.data?.data?.transaction_hash) {
          if (responseTrx?.data?.data?.status === 'FAILED') {
            setTransactionHash('FAILED');
          } else {
            setTransactionHash(responseTrx.data.data.transaction_hash);
          }
          clearInterval(trxInterval); // Clear the interval if transaction_hash is found
        } else {
          if (responseTrx?.data?.data?.status === 'FAILED') {
            setTransactionHash('FAILED');
            clearInterval(trxInterval);
          }
        }
        setLoading(false);
      };

      trxInterval = setInterval(() => {
        getTrxProcess();
      }, 1000);

      // Clear the interval on component unmount to prevent memory leaks
      return () => clearInterval(trxInterval);
    }
  }, [transferPayload?.data?.transaction_id]);

  // const getData = async () => {
  //   try {
  //     const response = await axios.get(
  //       'https://mainnet.yeetpay.id/api/transactions/' +
  //         transferPayload?.data?.transaction_id,
  //     );

  //     setData(response?.data?.data);
  //   } catch (error) {
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const renderActions = useCallback(() => {
    // const decodedTxs = r.result ?? [];

    return (
      <View paddingHorizontal={20}>
        {!loading ? (
          <View>
            <Text mb={8}>
              Please complete your payment by transfer to below Virtual Account
              Number
            </Text>
            <View
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <View>
                <Text>BCA Virtual Account</Text>
                <TouchableOpacity
                  onPress={() =>
                    copyText(
                      data?.payment_code,
                      ETranslations.global_link_copied,
                    )
                  }
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <Text fontWeight={'bold'} fontSize={16}>
                    {data?.payment_code}
                  </Text>
                  <IconButton
                    onPress={() =>
                      copyText(
                        data?.payment_code,
                        ETranslations.global_link_copied,
                      )
                    }
                    icon="ClipboardOutline"
                    size="small"
                  />
                </TouchableOpacity>
              </View>
              <Image
                height={80}
                width={120}
                resizeMode="contain"
                source={LogoBCA}
              />
            </View>
            <View style={{ marginTop: 30 }}>
              <Text
                style={{
                  color: 'white',
                  marginBottom: 8,
                }}
              >
                For Testnet version, to simulate the payment, please follow the
                steps:
              </Text>
              <Text
                style={{
                  color: 'white',
                }}
              >
                {[
                  '1.⁠ ⁠Check your email,\n2.⁠ ⁠Copy your iPayMu ID,\n3.⁠ ⁠Go to',
                  <Text
                    style={{ color: '#2b83ff' }}
                    onPress={() =>
                      Linking.openURL('https://sandbox.ipaymu.com/notify')
                    }
                  >
                    {' '}
                    https://sandbox.ipaymu.com/notify
                  </Text>,
                  '\n4.⁠ ⁠Paste the ID to Sandbox Transaction ID,\n5.⁠ ⁠Click submit button',
                ]}
              </Text>
            </View>
          </View>
        ) : (
          <View />
        )}
        <Modal transparent visible={loading}>
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size={40} color={'white'} />
          </View>
        </Modal>
        <Modal transparent visible={!!transactionHash}>
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                backgroundColor: '#0f0f0f',
                borderRadius: 20,
                width: '90%',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
              }}
            >
              <TouchableOpacity
                style={{ alignSelf: 'flex-end' }}
                hitSlop={{
                  top: 16,
                  right: 16,
                  left: 16,
                  bottom: 16,
                }}
                onPress={() => {
                  setTransactionHash(null);
                  navigation.popStack();
                }}
              >
                <Icon name="CrossedSmallSolid" color="white" size="$8" />
              </TouchableOpacity>
              {transactionHash === 'FAILED' ? (
                <Text
                  style={{
                    fontSize: 20,
                    marginBottom: 24,
                    textAlign: 'center',
                    color: 'white',
                    marginTop: 16,
                  }}
                >
                  Your transaction has failed
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 20,
                    marginBottom: 24,
                    textAlign: 'center',
                    color: 'white',
                    marginTop: 16,
                  }}
                >
                  Your transaction hash is:{'\n'}
                  {transactionHash}
                </Text>
              )}
              <Button
                style={{ color: 'white', borderWidth: 1, borderColor: 'white' }}
                onPress={async () => {
                  copyText(transactionHash);
                }}
              >
                Copy transaction hash
              </Button>
              <Button
                style={{
                  color: 'white',
                  borderWidth: 1,
                  borderColor: 'white',
                  marginTop: 8,
                }}
                onPress={async () => {
                  copyText(
                    'https://explorer-x0sepolia-id058i99l1.t.conduit.xyz/tx/' +
                      transactionHash +
                      '?tab=state',
                  );
                  await Linking.openURL(
                    'https://explorer-x0sepolia-id058i99l1.t.conduit.xyz/tx/' +
                      transactionHash +
                      '?tab=state',
                  );

                  navigation.popStack();
                  setTransactionHash('');
                }}
              >
                Open transaction detail in browser
              </Button>
            </View>
          </View>
        </Modal>
      </View>
    );

    // if (nativeTokenInfo.isLoading) {
    //   return (
    //     <InfoItemGroup>
    //       <InfoItem
    //         label={
    //           <Stack py="$1">
    //             <Skeleton height="$3" width="$12" />
    //           </Stack>
    //         }
    //         renderContent={
    //           <XStack space="$3" alignItems="center">
    //             <Skeleton height="$10" width="$10" radius="round" />
    //             <Stack>
    //               <Stack py="$1.5">
    //                 <Skeleton height="$3" width="$24" />
    //               </Stack>
    //               <Stack py="$1">
    //                 <Skeleton height="$3" width="$12" />
    //               </Stack>
    //             </Stack>
    //           </XStack>
    //         }
    //       />
    //       <InfoItem
    //         label={
    //           <Stack py="$1">
    //             <Skeleton height="$3" width="$8" />
    //           </Stack>
    //         }
    //         renderContent={
    //           <Stack py="$1">
    //             <Skeleton height="$3" width="$56" />
    //           </Stack>
    //         }
    //       />
    //       <InfoItem
    //         label={
    //           <Stack py="$1">
    //             <Skeleton height="$3" width="$8" />
    //           </Stack>
    //         }
    //         renderContent={
    //           <Stack py="$1">
    //             <Skeleton height="$3" width="$56" />
    //           </Stack>
    //         }
    //       />
    //     </InfoItemGroup>
    //   );
    // }

    // return decodedTxs.map((decodedTx, index) => (
    //   <TxActionsListView
    //     key={index}
    //     componentType={ETxActionComponentType.DetailView}
    //     decodedTx={decodedTx}
    //     isSendNativeToken={isSendNativeToken}
    //     nativeTokenTransferAmountToUpdate={
    //       nativeTokenTransferAmountToUpdate.amountToUpdate
    //     }
    //   />
    // ));
  }, [loading, data, transactionHash]);

  return <>{renderActions()}</>;
}

export default memo(TxActionsContainer);
