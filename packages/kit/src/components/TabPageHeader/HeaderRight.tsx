import { useCallback, useMemo } from 'react';

import { useIntl } from 'react-intl';

import { useMedia } from '@onekeyhq/components';
import {
  HeaderButtonGroup,
  HeaderIconButton,
} from '@onekeyhq/components/src/layouts/Navigation/Header';
import { useActiveAccount } from '@onekeyhq/kit/src/states/jotai/contexts/accountSelector';
import {
  useAllTokenListAtom,
  useAllTokenListMapAtom,
} from '@onekeyhq/kit/src/states/jotai/contexts/tokenList';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import {
  EModalRoutes,
  EModalSendRoutes,
  EModalSettingRoutes,
} from '@onekeyhq/shared/src/routes';
import { EAccountSelectorSceneName } from '@onekeyhq/shared/types';

import backgroundApiProxy from '../../background/instance/backgroundApiProxy';
import useAppNavigation from '../../hooks/useAppNavigation';
import { UrlAccountNavHeader } from '../../views/Home/pages/urlAccount/UrlAccountNavHeader';
import useScanQrCode from '../../views/ScanQrCode/hooks/useScanQrCode';

import { UniversalSearchInput } from './UniversalSearchInput';
import { useAtom } from 'jotai';
import { myAccountAtom } from '../../states/jotai/myAccountAtom';

export function HeaderRight({
  sceneName,
}: {
  sceneName: EAccountSelectorSceneName;
}) {
  const intl = useIntl();
  const navigation = useAppNavigation();
  const scanQrCode = useScanQrCode();
  const myAccount = useAtom(myAccountAtom);

  const {
    activeAccount: { account, network },
  } = useActiveAccount({ num: 0 });
  const [allTokens] = useAllTokenListAtom();
  const [map] = useAllTokenListMapAtom();
  const openSettingPage = useCallback(() => {
    navigation.pushModal(EModalRoutes.SettingModal, {
      screen: EModalSettingRoutes.SettingListModal,
    });
  }, [navigation]);
  const onScanButtonPressed = useCallback(async () => {
    const result = await scanQrCode.start({
      handlers: scanQrCode.PARSE_HANDLER_NAMES.all,
      autoHandleResult: true,
      account,
      tokens: {
        data: allTokens.tokens,
        keys: allTokens.keys,
        map,
      },
    });
    console.log('REE', result);
    if (typeof result?.data === 'string') {
      navigation.pushModal(EModalRoutes.SendModal, {
        screen: EModalSendRoutes.SendDataInput,
        params: {
          accountId: myAccount?.address,
          networkId: network?.id,
          isNFT: false,
          address: result?.data,
          token: {
            '$key':
              'evm--170845_0x42e19b59fa5632c01b87666a400a002a695251d2_0x0000000000000000000000000000000000000000',
            'address': '0x0000000000000000000000000000000000000000',
            'decimals': 6,
            'isNative': false,
            'logoURI': 'https://uni.onekey-asset.com/static/chain/eth.png',
            'name': 'ETH',
            'riskLevel': 1,
            'symbol': 'ETH',
            'totalSupply': '',
          },
        },
      });
    }
  }, [scanQrCode, account, allTokens, map]);

  const openExtensionExpandTab = useCallback(async () => {
    await backgroundApiProxy.serviceApp.openExtensionExpandTab({
      routes: '',
    });
  }, []);

  const media = useMedia();
  const items = useMemo(() => {
    const settingsButton = (
      <HeaderIconButton
        key="setting"
        title={intl.formatMessage({ id: ETranslations.settings_settings })}
        icon="SettingsOutline"
        testID="setting"
        onPress={openSettingPage}
      />
    );
    const expandExtView = (
      <HeaderIconButton
        key="expandExtView"
        title={intl.formatMessage({ id: ETranslations.global_expand_view })}
        icon="CameraExposureSquareOutline"
        onPress={openExtensionExpandTab}
      />
    );
    const scanButton = (
      <HeaderIconButton
        key="scan"
        title={intl.formatMessage({ id: ETranslations.scan_scan_qr_code })}
        icon="ScanOutline"
        onPress={onScanButtonPressed}
      />
    );
    const searchInput = media.gtMd ? (
      <UniversalSearchInput key="searchInput" />
    ) : null;

    if (sceneName === EAccountSelectorSceneName.homeUrlAccount) {
      return [
        platformEnv.isNative ? null : (
          <UrlAccountNavHeader.OpenInApp key="urlAccountOpenInApp" />
        ),
        <UrlAccountNavHeader.Share key="urlAccountShare" />,
      ].filter(Boolean);
    }

    if (platformEnv.isExtensionUiPopup) {
      return [expandExtView, settingsButton];
    }

    return [scanButton, settingsButton, searchInput];
  }, [
    intl,
    media.gtMd,
    onScanButtonPressed,
    openExtensionExpandTab,
    openSettingPage,
    sceneName,
  ]);
  return (
    <HeaderButtonGroup testID="Wallet-Page-Header-Right">
      {items}
    </HeaderButtonGroup>
  );
}
