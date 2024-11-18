import React, { useState } from 'react';
import { Modal, View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SizableText } from 'tamagui';
import moment from 'moment';

import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Icon } from '@onekeyhq/components';

type IProps = {
  data: any;
  children: React.ReactNode;
};

export default function TxHistoryModal(props: IProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const renderIcon = (symbol: string) => {
    if (symbol === 'x0') {
      return 'https://x0pay.com/images/logo-primary.png';
    } else if (symbol === 'Tether USD') {
      return 'https://seeklogo.com/images/T/tether-usdt-logo-FA55C7F397-seeklogo.com.png';
    } else {
      return 'https://uni.onekey-asset.com/static/chain/eth.png';
    }
  };

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

  const renderStatus = (status: string) => {
    if (status === 'SENT') {
      return 'Sent';
    } else if (status === 'FAILED') {
      return 'Failed';
    } else {
      return '-';
    }
  };

  const renderSymbol = (symbol: string) => {
    if (symbol === 'Tether USD') {
      return 'USDT';
    } else {
      return symbol;
    }
  };

  const renderAddress = (address) => {
    return (
      address.substring(0, 6) + '...' + address.substring(address.length - 4)
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.centeredView}>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View style={styles.navbar}>
                <TouchableOpacity
                  style={styles.buttonClose}
                  onPress={() => setModalVisible(false)}
                >
                  <Icon name="ArrowLeftOutline" size="$6" />
                </TouchableOpacity>
                <View style={styles.titleView}>
                  <SizableText style={styles.textTitle} size="$bodyLgMedium">
                    Transactions Detail
                  </SizableText>
                </View>
              </View>
              <View style={styles.contentStyles}>
                <Image
                  style={{ width: 50, height: 50 }}
                  source={{
                    uri: renderIcon(props.data.token.symbol),
                  }}
                />
                <SizableText style={styles.logoText}>
                  {renderTransferType(
                    props.data.transfer_type,
                    props.data.type,
                    props.data.hasOwnProperty('receiver') || false,
                  )}{' '}
                  ({renderSymbol(props.data.token.symbol)})
                </SizableText>
                <SizableText
                  size="$bodyLgMedium"
                  textAlign="right"
                  style={{ fontWeight: 'bold' }}
                >
                  {props.data.amount || '0'}
                </SizableText>
                {props.data.hasOwnProperty('receiver') ? (
                  <View style={styles.listDetail}>
                    <SizableText size="$bodyLgMedium">Receiver</SizableText>
                    <SizableText style={styles.bold} size="$bodyLgMedium">
                      {renderAddress(props.data.receiver)}
                    </SizableText>
                  </View>
                ) : (
                  <View style={styles.listDetail}>
                    <SizableText size="$bodyLgMedium">Sender</SizableText>
                    <SizableText style={styles.bold} size="$bodyLgMedium">
                      {renderAddress(props.data.sender)}
                    </SizableText>
                  </View>
                )}
                <View style={styles.listDetail}>
                  <SizableText size="$bodyLgMedium">Status</SizableText>
                  <SizableText
                    style={styles.bold}
                    color={
                      renderStatus(props.data.status) === 'Sent'
                        ? 'green'
                        : 'red'
                    }
                    size="$bodyLgMedium"
                  >
                    {renderStatus(props.data.status)}
                  </SizableText>
                </View>
                <View style={styles.listDetail}>
                  <SizableText size="$bodyLgMedium">Date</SizableText>
                  <SizableText style={styles.bold} size="$bodyLgMedium">
                    {moment(props.data.updated_at).format(
                      moment(props.data.updated_at).calendar().includes('Today')
                        ? 'hh:mm a'
                        : 'dddd, DD MMM YYYY',
                    )}
                  </SizableText>
                </View>
                <View style={styles.listDetail}>
                  <SizableText size="$bodyLgMedium">Amount</SizableText>
                  <SizableText style={styles.bold} size="$bodyLgMedium">
                    {props.data.amount || '0'}
                  </SizableText>
                </View>
                <View style={styles.listDetail}>
                  <SizableText size="$bodyLgMedium">
                    Amount in Rupiah
                  </SizableText>
                  <SizableText style={styles.bold} size="$bodyLgMedium">
                    Rp {props.data.fiat_amount || '0'}
                  </SizableText>
                </View>
              </View>
            </View>
          </View>
        </Modal>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          {props.children}
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0f0f0f',
    borderRadius: 0,
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  contentStyles: {
    marginTop: 20,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  navbar: {
    width: '100%',
    flexDirection: 'row',
    paddingRight: 40,
  },
  titleView: {
    flex: 1,
    alignItems: 'center',
  },
  textTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    width: 40,
    height: 40,
  },
  textStyle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoText: {
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
  },
  listDetail: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  bold: {
    fontWeight: 'bold',
  },
});
