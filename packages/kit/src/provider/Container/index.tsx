import { RootSiblingParent } from 'react-native-root-siblings';

import useAppNavigation from '../../hooks/useAppNavigation';
import { JotaiContextRootProvidersAutoMount } from '../../states/jotai/utils/JotaiContextStoreMirrorTracker';

import { AppStateLockContainer } from './AppStateLockContainer';
import { CloudBackupContainer } from './CloudBackupContainer';
import { ErrorToastContainer } from './ErrorToastContainer';
import { FlipperPluginsContainer } from './FlipperPluginsContainer';
import { ForceFirmwareUpdateContainer } from './ForceFirmwareUpdateContainer';
import { FullWindowOverlayContainer } from './FullWindowOverlayContainer';
import { GlobalWalletConnectModalContainer } from './GlobalWalletConnectModalContainer';
import { HardwareUiStateContainer } from './HardwareUiStateContainer';
import { KeyboardContainer } from './KeyboardContainer';
import { NavigationContainer } from './NavigationContainer';
import { PortalBodyContainer } from './PortalBodyContainer';
import { QrcodeDialogContainer } from './QrcodeDialogContainer';
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useEffect } from 'react';
import { myAccountAtom } from '../../states/jotai/myAccountAtom';
import { useAtom } from 'jotai';
import axios from 'axios';

function GlobalRootAppNavigationUpdate() {
  const navigation = useAppNavigation();
  global.$rootAppNavigation = navigation;
  return null;
}

export function Container() {
  if (Platform.OS === 'android') {
    GoogleSignin.configure({
      webClientId:
        '97012934568-5471jl4oo30dl89npukqkpj6tqb2icth.apps.googleusercontent.com',
      offlineAccess: true,
      // forceCodeForRefreshToken: true,
      scopes: [
        // 'https://www.googleapis.com/auth/userinfo.email',
        // 'https://www.googleapis.com/auth/userinfo.profile',
      ],
    });
  }

  const [myAccount, setMyAccount] = useAtom(myAccountAtom);

  return (
    <RootSiblingParent>
      <AppStateLockContainer>
        <KeyboardContainer />
        <NavigationContainer>
          <GlobalRootAppNavigationUpdate />
          <JotaiContextRootProvidersAutoMount />
          <QrcodeDialogContainer />
          <HardwareUiStateContainer />
          <CloudBackupContainer />
          <FullWindowOverlayContainer />
          <PortalBodyContainer />
          <ErrorToastContainer />
          <ForceFirmwareUpdateContainer />
          {process.env.NODE_ENV !== 'production' ? (
            <>
              <FlipperPluginsContainer />
            </>
          ) : null}
        </NavigationContainer>
        <GlobalWalletConnectModalContainer />
      </AppStateLockContainer>
    </RootSiblingParent>
  );
}
