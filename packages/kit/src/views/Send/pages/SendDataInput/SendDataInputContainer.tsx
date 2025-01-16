/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFocusEffect, useRoute } from '@react-navigation/core';
import BigNumber from 'bignumber.js';
import { isNaN, isNil } from 'lodash';
import { useIntl } from 'react-intl';

import {
  Button,
  Form,
  Icon,
  Input,
  Page,
  SizableText,
  TextArea,
  XStack,
  useClipboard,
  useForm,
  useMedia,
} from '@onekeyhq/components';
import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { AccountSelectorProviderMirror } from '@onekeyhq/kit/src/components/AccountSelector';
import {
  AddressInput,
  type IAddressInputValue,
} from '@onekeyhq/kit/src/components/AddressInput';
import { AmountInput } from '@onekeyhq/kit/src/components/AmountInput';
import { ListItem } from '@onekeyhq/kit/src/components/ListItem';
import { Token } from '@onekeyhq/kit/src/components/Token';
import { useAccountData } from '@onekeyhq/kit/src/hooks/useAccountData';
import useAppNavigation from '@onekeyhq/kit/src/hooks/useAppNavigation';
import { usePromiseResult } from '@onekeyhq/kit/src/hooks/usePromiseResult';
import { useSendConfirm } from '@onekeyhq/kit/src/hooks/useSendConfirm';
import {
  useAllTokenListAtom,
  useAllTokenListMapAtom,
  useTokenListMapAtom,
} from '@onekeyhq/kit/src/states/jotai/contexts/tokenList';
import { getFormattedNumber } from '@onekeyhq/kit/src/utils/format';
import { useSettingsPersistAtom } from '@onekeyhq/kit-bg/src/states/jotai/atoms';
import type { ITransferInfo } from '@onekeyhq/kit-bg/src/vaults/types';
import { OneKeyError, OneKeyInternalError } from '@onekeyhq/shared/src/errors';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import {
  EModalSendRoutes,
  IModalSendParamList,
} from '@onekeyhq/shared/src/routes';
import {
  EAssetSelectorRoutes,
  EModalRoutes,
} from '@onekeyhq/shared/src/routes';
import accountUtils from '@onekeyhq/shared/src/utils/accountUtils';
import hexUtils from '@onekeyhq/shared/src/utils/hexUtils';
import { EAccountSelectorSceneName } from '@onekeyhq/shared/types';
import type { IAccountNFT } from '@onekeyhq/shared/types/nft';
import { ENFTType } from '@onekeyhq/shared/types/nft';
import type { IToken, ITokenFiat } from '@onekeyhq/shared/types/token';

import { showBalanceDetailsDialog } from '../../../Home/components/BalanceDetailsDialog';
import { HomeTokenListProviderMirror } from '../../../Home/components/HomeTokenListProvider/HomeTokenListProviderMirror';

import type { RouteProp } from '@react-navigation/core';
import { useAtom } from 'jotai';
import { myAccountAtom } from '../../../../states/jotai/myAccountAtom';
import { ethers } from 'ethers';
import {
  ActivityIndicator,
  Linking,
  Modal,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import { Text } from 'tamagui';

function SendDataInputContainer() {
  const intl = useIntl();
  const media = useMedia();
  const route =
    useRoute<RouteProp<IModalSendParamList, EModalSendRoutes.SendDataInput>>();

  const {
    networkId,
    accountId,
    isNFT,
    token,
    nfts,
    address,
    amount: sendAmount = '',
    type,
    isSourceAccount,
    sourceToken,
    isBuy,
    isPay,
  } = route?.params;

  const [isUseFiat, setIsUseFiat] = useState(type === 'fiat');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMaxSend, setIsMaxSend] = useState(false);
  const [isFirstTime, setFirstTime] = useState(true);
  const [settings] = useSettingsPersistAtom();
  const [isLoadingFiat, setLoadingFiat] = useState(false);
  const navigation = useAppNavigation();

  const [allTokens] = useAllTokenListAtom();
  const [map] = useAllTokenListMapAtom();
  const [transactionHash, setTransactionHash] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [maxFiatPrice, setMaxFiatPrice] = useState(0);
  const { copyText } = useClipboard();

  const { serviceNFT, serviceToken } = backgroundApiProxy;

  const nft = nfts?.[0];
  const [myAccount] = useAtom(myAccountAtom);

  const [tokenInfo, setTokenInfo] = useState(token || sourceToken);
  const { account, network } = useAccountData({ accountId, networkId });
  const sendConfirm = useSendConfirm({
    accountId: myAccount?.address,
    networkId,
  });

  const isSelectTokenDisabled = allTokens.tokens.length <= 1;

  const tokenMinAmount = useMemo(() => {
    if (!tokenInfo || isNaN(tokenInfo.decimals)) {
      return 0;
    }

    return new BigNumber(1).shiftedBy(-tokenInfo.decimals).toFixed();
  }, [tokenInfo]);

  const [tokenListMap] = useTokenListMapAtom();
  const activeToken = useMemo(() => {
    if (tokenInfo) {
      if (isSourceAccount) {
        return sourceToken;
      }
      return map[tokenInfo['$key']];
    }
    return '';
  }, [tokenInfo, sourceToken, isSourceAccount]);

  const {
    result: [
      tokenDetails,
      nftDetails,
      vaultSettings,
      hasFrozenBalance,
      displayMemoForm,
      displayPaymentIdForm,
      memoMaxLength,
      numericOnlyMemo,
    ] = [],
    isLoading: isLoadingAssets,
  } = usePromiseResult(
    async () => {
      if (!account || !network) return;
      if (!token && !nft) {
        throw new OneKeyInternalError('token and nft info are both missing.');
      }

      let nftResp: IAccountNFT[] | undefined;
      let tokenResp:
        | ({
            info: IToken;
          } & ITokenFiat)[]
        | undefined;

      const accountAddress =
        await backgroundApiProxy.serviceAccount.getAccountAddressForApi({
          accountId,
          networkId,
        });
      if (isNFT && nft) {
        nftResp = await serviceNFT.fetchNFTDetails({
          networkId,
          accountAddress,
          nfts: [
            {
              collectionAddress: nft.collectionAddress,
              itemId: nft.itemId,
            },
          ],
        });
      } else if (!isNFT && tokenInfo) {
        const checkInscriptionProtectionEnabled =
          await backgroundApiProxy.serviceSetting.checkInscriptionProtectionEnabled(
            {
              networkId,
              accountId,
            },
          );
        const withCheckInscription =
          checkInscriptionProtectionEnabled && settings.inscriptionProtection;
        // tokenResp = await serviceToken.fetchTokensDetails({
        //   networkId,
        //   accountId,
        //   contractList: [tokenInfo.address],
        //   withFrozenBalance: true,
        //   withCheckInscription,
        // });
        tokenResp = [];
      }

      const vs = await backgroundApiProxy.serviceNetwork.getVaultSettings({
        networkId,
      });

      const frozenBalanceSettings =
        await backgroundApiProxy.serviceSend.getFrozenBalanceSetting({
          networkId,
          tokenDetails: tokenResp?.[0],
        });

      return [
        tokenResp?.[0],
        nftResp?.[0],
        vs,
        frozenBalanceSettings,
        vs.withMemo,
        vs.withPaymentId,
        vs.memoMaxLength,
        vs.numericOnlyMemo,
      ];
    },
    [
      account,
      accountId,
      isNFT,
      network,
      networkId,
      nft,
      serviceNFT,
      serviceToken,
      token,
      tokenInfo,
      settings.inscriptionProtection,
    ],
    { watchLoading: true, alwaysSetState: true },
  );

  if (tokenDetails && isNil(activeToken?.balanceParsed)) {
    tokenDetails.balanceParsed = new BigNumber(tokenDetails.balance)
      .shiftedBy(tokenDetails.info.decimals * -1)
      .toFixed();
  }
  const currencySymbol = settings.currencyInfo.symbol;
  const tokenSymbol = tokenDetails?.info.symbol ?? '';

  const form = useForm({
    defaultValues: {
      to: { raw: address } as IAddressInputValue,
      amount: sendAmount,
      nftAmount: sendAmount || '1',
      memo: '',
      paymentId: '',
    },
    mode: 'onChange',
    reValidateMode: 'onBlur',
  });

  // token amount or fiat amount
  const amount = form.watch('amount');
  const toPending = form.watch('to.pending');
  const toResolved = form.watch('to.resolved');
  const nftAmount = form.watch('nftAmount');

  const linkedAmount = useMemo(() => {
    let amountBN = new BigNumber(amount ?? 0);
    amountBN = amountBN.isNaN() ? new BigNumber(0) : amountBN;

    const tokenPrice = tokenDetails?.price;

    if (isNil(tokenPrice))
      return {
        amount: '0',
        originalAmount: '0',
      };

    if (isUseFiat) {
      const originalAmount = amountBN.dividedBy(tokenPrice).toFixed();
      return {
        amount: getFormattedNumber(originalAmount, { decimal: 4 }) ?? '0',
        originalAmount,
      };
    }

    const originalAmount = amountBN.times(tokenPrice).toFixed();
    return {
      originalAmount,
      amount: getFormattedNumber(originalAmount, { decimal: 4 }) ?? '0',
    };
  }, [amount, isUseFiat, tokenDetails?.price]);

  const {
    result: { displayAmountFormItem } = { displayAmountFormItem: false },
  } = usePromiseResult(async () => {
    const vs = await backgroundApiProxy.serviceNetwork.getVaultSettings({
      networkId,
    });
    if (!vs?.hideAmountInputOnFirstEntry) {
      return {
        displayAmountFormItem: true,
      };
    }
    if (toResolved) {
      const toRaw = form.getValues('to').raw;
      const validation =
        await backgroundApiProxy.serviceValidator.validateAmountInputShown({
          networkId,
          toAddress: toRaw ?? '',
        });
      return {
        displayAmountFormItem: validation.isValid,
      };
    }
    return {
      displayAmountFormItem: false,
    };
  }, [toResolved, networkId, form]);

  const handleOnChangeAmountMode = useCallback(() => {
    setIsUseFiat((prev) => !prev);

    form.setValue('amount', linkedAmount.originalAmount);
  }, [form, linkedAmount]);
  const handleOnSelectToken = useCallback(() => {
    if (isSelectTokenDisabled) return;
    if (!isSourceAccount) {
      navigation.pushModal(EModalRoutes.AssetSelectorModal, {
        screen: EAssetSelectorRoutes.TokenSelector,
        params: {
          networkId,
          accountId,
          tokens: {
            data: allTokens.tokens,
            keys: allTokens.keys,
            map: map,
          },
          onSelect: (data: IToken) => {
            setTokenInfo(data);
          },
        },
      });
    } else {
    }
  }, [
    accountId,
    allTokens.keys,
    allTokens.tokens,
    sourceToken,
    isSourceAccount,
    isSelectTokenDisabled,
    map,
    navigation,
    networkId,
  ]);

  useEffect(() => {
    if (transactionId) {
      let trxInterval;
      const getTrxProcess = async () => {
        const responseTrx = await axios.get(
          'https://mainnet.yeetpay.id/api/transactions/' +
            transactionId,
        );
        console.log('RES', responseTrx?.data?.data);
        if (responseTrx?.data?.data?.transaction_hash) {
          console.log('REEE', responseTrx?.data);
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
      };

      trxInterval = setInterval(() => {
        getTrxProcess();
      }, 1000);

      // Clear the interval on component unmount to prevent memory leaks
      return () => clearInterval(trxInterval);
    }
  }, [transactionId]);

  const handleTopUp = useCallback(async () => {
    console.log('HUAA', sourceToken);
    try {
      setIsSubmitting(true);
      const realAmount = amount;

      let responseFiat;
      if (isUseFiat) {
        responseFiat = await axios.get(
          'https://mainnet.yeetpay.id/api/exchanges/token-amount/' +
            realAmount,
        );
      }

      const payload = {
        'recepient': myAccount?.account_abstraction_address,
        'amount': isUseFiat
          ? responseFiat?.data?.data?.token_amount
          : realAmount,
        'privateKey':
          '0x888ba851684c19a009e70da34f12c46c6633653bd418542eb338af3b47893947',
      };

      const response = await axios.post(
        'https://mainnet.yeetpay.id/api/transactions',
        payload,
      );
    } catch (e: any) {
      setIsSubmitting(false);

      if (accountUtils.isWatchingAccount({ accountId: account?.id ?? '' })) {
        throw new OneKeyError({
          message: intl.formatMessage({
            id: ETranslations.wallet_error_trade_with_watched_acocunt,
          }),
          autoToast: true,
        });
      }

      throw new OneKeyError({
        message: e.message,
        autoToast: true,
      });
    }
  }, [
    account,
    amount,
    form,
    intl,
    isMaxSend,
    isNFT,
    isUseFiat,
    linkedAmount.originalAmount,
    nftAmount,
    nftDetails,
    sendConfirm,
    tokenDetails,
  ]);

  const handleOnConfirm = useCallback(async () => {
    if (isPay) {
      handleTopUp();
      return;
    }
    try {
      if (!myAccount?.account_abstraction_address) return;
      if (isSourceAccount) {
        alert('Submitted');
        return;
      }
      const toAddress = form.getValues('to').resolved;
      if (!isBuy && !toAddress) return;
      const realAmount = amount;
      setIsSubmitting(true);

      let responseFiat;
      if (isUseFiat || isBuy) {
        responseFiat = await axios.get(
          'https://mainnet.yeetpay.id/api/exchanges/token-amount/' +
            realAmount,
        );
      }

      try {
        // '0x4a69f6F98EB7f7e66188F593F96ff905441Ae0D3'
        const payload = {
          'sender_address': myAccount?.account_abstraction_address,
          'receiver_address': isBuy ? myAccount?.email : toAddress,
          'sent_amount':
            isUseFiat && !isBuy
              ? responseFiat?.data?.data?.token_amount
              : realAmount,
          'received_amount': isBuy
            ? responseFiat?.data?.data?.token_amount
            : isUseFiat
            ? Number(realAmount)
            : null,
          'sent_token_address':
            activeToken?.address ===
            '0x0000000000000000000000000000000000000000'
              ? null
              : activeToken?.address,
          'received_token_address':
            activeToken?.address ===
            '0x0000000000000000000000000000000000000000'
              ? null
              : activeToken?.address,
          'shard_device': myAccount?.shard_device,
          transfer_type: isBuy
            ? null
            : isUseFiat
            ? activeToken?.address ===
              '0x0000000000000000000000000000000000000000'
              ? 'NATIVE_TO_FIAT'
              : 'CRYPTO_TO_FIAT'
            : activeToken?.address ===
              '0x0000000000000000000000000000000000000000'
            ? 'NATIVE_TO_NATIVE'
            : 'CRYPTO_TO_CRYPTO',
          type: isBuy ? 'BUY_TOKEN' : 'TRANSFER',
        };
        console.log('PAYLOADDD', payload);
        console.log('activeToken', activeToken);

        const response = await axios.post(
          'https://mainnet.yeetpay.id/api/transactions',
          payload,
        );
        console.log('SUCCESS SEND', response?.data);
        if (isBuy) {
          navigation.push(EModalSendRoutes.SendConfirm, {
            accountId,
            networkId,
            unsignedTxs: [],
            // onSuccess,
            // onFail,
            // onCancel,
            transferPayload: {
              amountToSend: realAmount,
              isMaxSend,
              data: response?.data?.data,
            },
          });
          setIsSubmitting(false);
        } else {
          setTransactionId(response?.data?.data?.transaction_id);
        }
      } catch (error) {
        console.error('ERROIR SEND', error?.response?.data);
        setIsSubmitting(false);
      }

      // await sendConfirm.navigationToSendConfirm({
      //   // transfersInfo,
      //   sameModal: true,
      //   transferPayload: {
      //     amountToSend: realAmount,
      //     isMaxSend,
      //   },
      // });

      // setIsSubmitting(false);
    } catch (e: any) {
      setIsSubmitting(false);

      if (accountUtils.isWatchingAccount({ accountId: account?.id ?? '' })) {
        throw new OneKeyError({
          message: intl.formatMessage({
            id: ETranslations.wallet_error_trade_with_watched_acocunt,
          }),
          autoToast: true,
        });
      }

      throw new OneKeyError({
        message: e.message,
        autoToast: true,
      });
    }
  }, [
    account,
    amount,
    form,
    intl,
    isMaxSend,
    isNFT,
    isUseFiat,
    linkedAmount.originalAmount,
    nftAmount,
    nftDetails,
    sendConfirm,
    tokenDetails,
  ]);

  const isSubmitDisabled = useMemo(() => {
    if (isLoadingAssets || isSubmitting || toPending) return true;

    if (!form.formState.isValid) {
      return true;
    }

    if (isNFT && nft?.collectionType === ENFTType.ERC1155 && !nftAmount) {
      return true;
    }

    if (!isNFT && !amount && displayAmountFormItem) {
      return true;
    }
  }, [
    isLoadingAssets,
    isSubmitting,
    toPending,
    form.formState.isValid,
    isNFT,
    nft?.collectionType,
    nftAmount,
    amount,
    displayAmountFormItem,
  ]);

  const maxAmount = useMemo(() => {
    // if (isUseFiat) {
    //   return tokenDetails?.fiatValue ?? '0';
    // }
    return activeToken?.balanceParsed ?? '0';
  }, [
    isUseFiat,
    activeToken?.balanceParsed,
    tokenDetails?.fiatValue,
    activeToken,
  ]);
  const handleValidateTokenAmount = useCallback(
    async (value: string) => {
      const amountBN = new BigNumber(value ?? 0);

      let isInsufficientBalance = false;
      let isLessThanMinTransferAmount = false;
      if (isBuy) {
      } else if (isUseFiat) {
        if (amountBN.isGreaterThan(maxFiatPrice * Number(maxAmount))) {
          isInsufficientBalance = true;
        }
        const convertedValue = new BigNumber(
          Number(
            ((Number(form.watch('amount')) + 0.02) / maxFiatPrice).toFixed(2),
          ) ?? 0,
        );
        if (convertedValue.isLessThan(2)) {
          isLessThanMinTransferAmount = true;
        }

        // if (
        //   tokenDetails?.price &&
        //   amountBN
        //     .dividedBy(tokenDetails.price)
        //     .isLessThan(vaultSettings?.minTransferAmount ?? 0)
        // ) {
        //   isLessThanMinTransferAmount = true;
        // }
      } else {
        if (amountBN.isGreaterThan(activeToken?.balanceParsed ?? 0)) {
          isInsufficientBalance = true;
        }

        // if (amountBN.isLessThan(vaultSettings?.minTransferAmount ?? 0)) {
        //   isLessThanMinTransferAmount = true;
        // }
      }

      if (isInsufficientBalance)
        return intl.formatMessage(
          {
            id: ETranslations.send_error_insufficient_balance,
          },
          {
            token: tokenSymbol,
          },
        );

      if (isLessThanMinTransferAmount)
        return intl.formatMessage(
          {
            id: ETranslations.send_error_minimum_amount,
          },
          {
            amount: BigNumber.max(
              tokenMinAmount,
              // vaultSettings?.minTransferAmount ?? '0',
              '2',
            ).toFixed(),
            token: tokenSymbol,
          },
        );

      if (
        !isNFT &&
        tokenDetails?.info.isNative &&
        amountBN.isZero() &&
        !vaultSettings?.transferZeroNativeTokenEnabled
      ) {
        return intl.formatMessage({
          id: ETranslations.send_cannot_send_amount_zero,
        });
      }

      return true;
    },
    [
      isNFT,
      tokenDetails?.info.isNative,
      tokenDetails?.fiatValue,
      tokenDetails?.price,
      activeToken?.balanceParsed,
      vaultSettings?.transferZeroNativeTokenEnabled,
      vaultSettings?.minTransferAmount,
      isUseFiat,
      intl,
      tokenSymbol,
      tokenMinAmount,
      form,
      accountId,
      networkId,
      maxFiatPrice,
    ],
  );

  const getTokenExchange = async (price) => {
    setLoadingFiat(true);
    try {
      const response = await axios.get(
        'https://mainnet.yeetpay.id/api/exchanges/token-amount/' +
          price,
      );
      if (response?.data) {
        setMaxFiatPrice(Number(response?.data?.data?.price));
      }
    } catch (error) {
    } finally {
      setLoadingFiat(false);
      setFirstTime(false);
    }
  };

  useEffect(() => {
    if (isUseFiat) {
      const price = 100; // Replace with the actual price or state variable if necessary
      const intervalId = setInterval(() => {
        getTokenExchange(price);
      }, 2000);
      // Clean up interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, []); //

  const renderTokenDataInputForm = useCallback(
    () => (
      <Form.Field
        name="amount"
        label={intl.formatMessage({ id: ETranslations.send_amount })}
        rules={{
          required: true,
          validate: handleValidateTokenAmount,
          onChange: (e: { target: { name: string; value: string } }) => {
            setIsMaxSend(false);
            const value = e.target?.value;
            const valueBN = new BigNumber(value ?? 0);
            if (valueBN.isNaN()) {
              const formattedValue = parseFloat(value);
              form.setValue(
                'amount',
                isNaN(formattedValue) ? '' : String(formattedValue),
              );
              return;
            }
            // const dp = valueBN.decimalPlaces();
            // if (!isUseFiat && dp && dp > (tokenDetails?.info.decimals ?? 0)) {
            //   form.setValue(
            //     'amount',
            //     valueBN.toFixed(tokenDetails?.info.decimals ?? 0),
            //   );
            // }
          },
        }}
      >
        {isUseFiat && (
          <Text style={{ position: 'absolute', right: 0 }}>For</Text>
        )}

        <AmountInput
          reversible
          enableMaxAmount={!isBuy}
          balanceProps={
            isBuy
              ? null
              : {
                  loading: isLoadingAssets,
                  value: isUseFiat
                    ? `Rp ${Math.floor(maxFiatPrice * maxAmount * 100) / 100}`
                    : maxAmount,
                  onPress: async () => {
                    if (isUseFiat) {
                      setLoadingFiat(true);
                      try {
                        form.setValue(
                          'amount',
                          String(
                            Math.floor(maxFiatPrice * maxAmount * 100) / 100,
                          ),
                        );
                      } catch (error) {
                      } finally {
                        setLoadingFiat(false);
                      }
                    } else {
                      form.setValue('amount', maxAmount);
                    }
                    void form.trigger('amount');
                    setIsMaxSend(true);
                  },
                }
          }
          valueProps={
            !isBuy && {
              value: isUseFiat
                ? `${linkedAmount.amount} ${tokenSymbol}`
                : `${currencySymbol}${linkedAmount.amount}`,
              onPress: handleOnChangeAmountMode,
            }
          }
          inputProps={{
            placeholder: '0',
            ...(isUseFiat && {
              leftAddOnProps: {
                label: currencySymbol,
                pr: '$0',
                pl: '$3.5',
                mr: '$-2',
              },
            }),
          }}
          tokenSelectorTriggerProps={{
            selectedTokenImageUri: isNFT
              ? nft?.metadata?.image
              : tokenInfo?.logoURI,
            selectedNetworkImageUri: network?.logoURI,
            selectedTokenSymbol: isNFT
              ? nft?.metadata?.name
              : tokenInfo?.symbol,
            onPress: isNFT ? undefined : handleOnSelectToken,
            disabled: isSelectTokenDisabled,
          }}
          {...(hasFrozenBalance && {
            balanceHelperProps: {
              onPress: () => {
                showBalanceDetailsDialog({
                  accountId,
                  networkId,
                });
              },
            },
          })}
        />
      </Form.Field>
    ),
    [
      accountId,
      currencySymbol,
      form,
      handleOnChangeAmountMode,
      handleOnSelectToken,
      handleValidateTokenAmount,
      hasFrozenBalance,
      intl,
      isLoadingAssets,
      isNFT,
      isSelectTokenDisabled,
      isUseFiat,
      linkedAmount.amount,
      maxAmount,
      network?.logoURI,
      networkId,
      nft?.metadata?.image,
      nft?.metadata?.name,
      tokenDetails?.info.decimals,
      tokenInfo?.logoURI,
      tokenInfo?.symbol,
      tokenSymbol,
    ],
  );
  const renderNFTDataInputForm = useCallback(() => {
    if (nft?.collectionType === ENFTType.ERC1155) {
      return (
        <Form.Field
          name="nftAmount"
          label={intl.formatMessage({ id: ETranslations.send_amount })}
          rules={{ required: true, max: nftDetails?.amount ?? 1, min: 1 }}
        >
          {isLoadingAssets ? null : (
            <SizableText
              size="$bodyMd"
              color="$textSubdued"
              position="absolute"
              right="$0"
              top="$0"
            >
              {intl.formatMessage({ id: ETranslations.global_available })}:{' '}
              {nftDetails?.amount ?? 1}
            </SizableText>
          )}
          <Input
            size="large"
            $gtMd={{
              size: 'medium',
            }}
            addOns={[
              {
                loading: isLoadingAssets,
                label: intl.formatMessage({ id: ETranslations.send_max }),
                onPress: () => {
                  form.setValue('nftAmount', nftDetails?.amount ?? '1');
                  void form.trigger('nftAmount');
                },
              },
            ]}
          />
        </Form.Field>
      );
    }
    return null;
  }, [form, intl, isLoadingAssets, nft?.collectionType, nftDetails?.amount]);

  const renderMemoForm = useCallback(() => {
    if (!displayMemoForm) return null;
    const maxLength = memoMaxLength || 256;
    const validateErrMsg = numericOnlyMemo
      ? intl.formatMessage({
          id: ETranslations.send_field_only_integer,
        })
      : undefined;
    const memoRegExp = numericOnlyMemo ? /^[0-9]+$/ : undefined;

    return (
      <>
        <XStack pt="$5" />
        <Form.Field
          label={intl.formatMessage({ id: ETranslations.send_tag })}
          labelAddon={
            <SizableText size="$bodyMdMedium" color="$textSubdued">
              {intl.formatMessage({
                id: ETranslations.form_optional_indicator,
              })}
            </SizableText>
          }
          name="memo"
          rules={{
            maxLength: {
              value: maxLength,
              message: intl.formatMessage(
                {
                  id: ETranslations.dapp_connect_msg_description_can_be_up_to_int_characters,
                },
                {
                  number: maxLength,
                },
              ),
            },
            validate: (value) => {
              if (!value || !memoRegExp) return undefined;
              const result = !memoRegExp.test(value);
              return result ? validateErrMsg : undefined;
            },
          }}
        >
          <TextArea
            numberOfLines={2}
            size="large"
            placeholder={intl.formatMessage({
              id: ETranslations.send_tag_placeholder,
            })}
          />
        </Form.Field>
      </>
    );
  }, [displayMemoForm, intl, memoMaxLength, numericOnlyMemo]);

  const renderPaymentIdForm = useCallback(() => {
    if (!displayPaymentIdForm) return null;
    return (
      <>
        <XStack pt="$5" />
        <Form.Field
          label="Payment ID"
          labelAddon={
            <SizableText size="$bodyMdMedium" color="$textSubdued">
              {intl.formatMessage({
                id: ETranslations.form_optional_indicator,
              })}
            </SizableText>
          }
          name="paymentId"
          rules={{
            validate: (value) => {
              if (!value) return undefined;
              if (
                !hexUtils.isHexString(hexUtils.addHexPrefix(value)) ||
                hexUtils.stripHexPrefix(value).length !== 64
              ) {
                return intl.formatMessage({
                  id: ETranslations.form_payment_id_error_text,
                });
              }
            },
          }}
        >
          <TextArea
            numberOfLines={2}
            size={media.gtMd ? 'medium' : 'large'}
            placeholder="Payment ID"
          />
        </Form.Field>
      </>
    );
  }, [displayPaymentIdForm, intl, media.gtMd]);

  const renderDataInput = useCallback(() => {
    if (isNFT) {
      return renderNFTDataInputForm();
    }
    if (displayAmountFormItem) {
      return (
        <>
          {renderTokenDataInputForm()}
          {renderMemoForm()}
          {renderPaymentIdForm()}
          {isUseFiat && form.watch('amount') && maxFiatPrice > 0 && (
            <Text style={{ marginTop: 8 }}>
              You will {isBuy ? 'receive' : 'sell'} estimately{' '}
              {Number(
                ((Number(form.watch('amount')) + 0.02) / maxFiatPrice).toFixed(
                  2,
                ),
              )}{' '}
              {tokenInfo?.symbol}
            </Text>
          )}
        </>
      );
    }
    return null;
  }, [
    isNFT,
    displayAmountFormItem,
    renderNFTDataInputForm,
    renderTokenDataInputForm,
    renderMemoForm,
    renderPaymentIdForm,
  ]);

  return (
    <Page scrollEnabled>
      <Page.Header
        title={
          isSourceAccount
            ? 'Top Up'
            : isBuy
            ? 'Buy Crypto'
            : type === 'fiat'
            ? 'Crypto To Fiat Payment'
            : intl.formatMessage({ id: ETranslations.send_title })
        }
      />
      <Page.Body px="$5" testID="send-recipient-amount-form">
        <AccountSelectorProviderMirror
          config={{
            sceneName: EAccountSelectorSceneName.addressInput, // can replace with other sceneName
            sceneUrl: '',
          }}
          enabledNum={[0]}
          availableNetworksMap={{
            0: { networkIds: [networkId], defaultNetworkId: networkId },
          }}
        >
          <Form form={form}>
            {isNFT ? (
              <Form.Field
                label={intl.formatMessage({ id: ETranslations.global_nft })}
                name="nft"
              >
                <ListItem
                  mx="$0"
                  borderWidth={1}
                  borderColor="$border"
                  borderRadius="$2"
                >
                  <XStack alignItems="center" space="$1" flex={1}>
                    <Token
                      isNFT
                      size="lg"
                      tokenImageUri={nft?.metadata?.image}
                      networkImageUri={network?.logoURI}
                    />
                    <ListItem.Text
                      flex={1}
                      primary={nft?.metadata?.name}
                      secondary={
                        <SizableText size="$bodyMd" color="$textSubdued">
                          {tokenInfo?.name}
                        </SizableText>
                      }
                    />
                  </XStack>
                </ListItem>
              </Form.Field>
            ) : null}
            {!isSourceAccount && !isBuy ? (
              <Form.Field
                label={intl.formatMessage({
                  id: ETranslations.global_recipient,
                })}
                name="to"
                rules={{
                  required: true,
                  validate: (value: IAddressInputValue) => {
                    if (value.pending) {
                      return;
                    }
                    if (!value.resolved) {
                      return (
                        value.validateError?.message ??
                        intl.formatMessage({
                          id: ETranslations.send_address_invalid,
                        })
                      );
                    }
                  },
                }}
              >
                <AddressInput
                  accountId={accountId}
                  networkId={networkId}
                  enableAddressBook
                  enableWalletName
                  enableVerifySendFundToSelf
                  enableAddressInteractionStatus
                  contacts
                  accountSelector={{ num: 0 }}
                  isUseFiat={isUseFiat}
                />
              </Form.Field>
            ) : (
              <View />
            )}
            {renderDataInput()}
          </Form>
        </AccountSelectorProviderMirror>
      </Page.Body>
      <Page.Footer
        onConfirm={handleOnConfirm}
        onConfirmText={
          type === 'fiat' ? (isBuy ? 'Buy' : 'Pay to Fiat') : 'Submit'
        }
        confirmButtonProps={{
          disabled: isSubmitDisabled,
          loading: isSubmitting,
        }}
      />
      <Modal transparent visible={isLoadingFiat && isFirstTime}>
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
    </Page>
  );
}

const SendDataInputContainerWithProvider = memo(() => (
  <HomeTokenListProviderMirror>
    <SendDataInputContainer />
  </HomeTokenListProviderMirror>
));
SendDataInputContainerWithProvider.displayName =
  'SendDataInputContainerWithProvider';

export { SendDataInputContainer, SendDataInputContainerWithProvider };
