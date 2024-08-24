import { useCallback, useState } from 'react';

import { useIntl } from 'react-intl';

import type {
  IButtonProps,
  IKeyOfIcons,
  IPageScreenProps,
  IXStackProps,
} from '@onekeyhq/components';
import {
  Alert,
  Anchor,
  Button,
  Dialog,
  Divider,
  Form,
  Group,
  Heading,
  Icon,
  IconButton,
  Image,
  Input,
  LinearGradient,
  Page,
  SizableText,
  Spinner,
  Stack,
  ThemeableStack,
  Toast,
  useForm,
  View,
  XStack,
} from '@onekeyhq/components';
import { useHelpLink } from '@onekeyhq/kit/src/hooks/useHelpLink';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import type { IOnboardingParamList } from '@onekeyhq/shared/src/routes';
import { EOnboardingPages, ERootRoutes } from '@onekeyhq/shared/src/routes';
import { openUrlExternal } from '@onekeyhq/shared/src/utils/openUrlUtils';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import backgroundApiProxy from '../../../background/instance/backgroundApiProxy';
import useAppNavigation from '../../../hooks/useAppNavigation';

import type { FormatXMLElementFn } from 'intl-messageformat';
import { useAtom, useSetAtom } from 'jotai';
import { activeAccountsAtom } from '../../../states/jotai/contexts/accountSelector';
import { myAccountAtom } from '../../../states/jotai/myAccountAtom';
import axios from 'axios';
import { ActivityIndicator } from 'react-native';
import { getPasswordKeyboardType } from '../../../components/Password/utils';

type IActionsGroupItem = {
  iconName: IKeyOfIcons;
  label: string;
  primary?: boolean;
  isLoading?: boolean;
} & IXStackProps;

type IActionsProp = {
  items: IActionsGroupItem[];
};

function ActionsGroup({ items }: IActionsProp) {
  return (
    <Group
      borderRadius="$3"
      $gtMd={{
        borderRadius: '$2',
      }}
      separator={<Divider />}
    >
      {items.map((item: IActionsGroupItem, index) => (
        <Group.Item key={index}>
          <XStack
            flexDirection="row"
            py="$3.5"
            px="$4"
            bg={item.primary ? '$bgPrimary' : '$bgStrong'}
            $gtMd={{
              py: '$2',
            }}
            hoverStyle={{
              bg: item.primary ? '$bgPrimaryHover' : '$bgStrongHover',
            }}
            pressStyle={{
              bg: item.primary ? '$bgPrimaryActive' : '$bgStrongActive',
            }}
            focusStyle={{
              outlineColor: '$focusRing',
              outlineStyle: 'solid',
              outlineWidth: 2,
            }}
            focusable
            userSelect="none"
            borderCurve="continuous"
            onPress={item.onPress}
            testID={item.testID}
          >
            <Icon
              name={item.iconName}
              color={item.primary ? '$iconInverse' : '$icon'}
            />
            <SizableText
              pl="$3"
              size="$bodyLgMedium"
              color={item.primary ? '$textInverse' : '$text'}
            >
              {item.label}
            </SizableText>
            {item?.isLoading ? (
              <XStack ml="$2">
                <Spinner />
              </XStack>
            ) : null}
          </XStack>
        </Group.Item>
      ))}
    </Group>
  );
}

export interface IPasswordSetupForm {
  password: string;
}

function RecoveryInput({ userInfo, onClose }: any) {
  const form = useForm<IPasswordSetupForm>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      password: '',
    },
  });

  const navigation = useAppNavigation();
  const [myAccount, setMyAccount] = useAtom(myAccountAtom);

  const [secureEntry, setSecureEntry] = useState(true);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: IPasswordSetupForm) => {
    // await backgroundApiProxy.servicePassword.promptPasswordVerify();
    // // navigation.push(EOnboardingPages.BeforeShowRecoveryPhrase);
    setLoading(true);
    try {
      // await GoogleSignin.hasPlayServices();
      // userInfo = await GoogleSignin.signIn();
      // const token = await GoogleSignin.getTokens();

      const responseToken = await axios.post(
        'https://langitapi.blockchainworks.id/api/clients/login',
        {
          'email': 'soul@yopmail.com',
          'password': 'testclient',
        },
      );

      const response = await axios.post(
        'https://langitapi.blockchainworks.id/api/accounts/recover',
        {
          email: userInfo?.user?.email,
          shard_email: values?.password,
        },
        {
          headers: {
            Authorization: `Bearer ${responseToken?.data?.data?.accessToken}`,
          },
        },
      );

      const responseAccount = await axios.get(
        'https://langitapi.blockchainworks.id/api/accounts/' +
          response?.data?.data?.id,
        {
          headers: {
            Authorization: `Bearer ${response?.data?.data?.accessToken}`,
          },
        },
      );

      console.log('REEE', responseAccount?.data);
      if (response?.status === 200) {
        setMyAccount({
          accountName: userInfo?.user?.name || '',
          email: userInfo?.user?.email,
          imageUrl: userInfo?.user?.photo || '',
          idToken: userInfo?.idToken || '',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          accessToken: responseToken?.data?.data?.accessToken,
          refreshToken: responseToken?.data?.data?.refreshToken,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ...response?.data?.data,
          ...responseAccount?.data?.data,
        });
        // // await GoogleSignin.signOut();
        // // await GoogleSignin.revokeAccess();
        onClose();
        navigation.navigate(ERootRoutes.Main);
      } else {
        await GoogleSignin.signOut();
        await GoogleSignin.revokeAccess();
        onClose();
      }
    } catch (error) {
      // @ts-ignore
      console.log(error?.response);
      Toast.message({ message: 'Wrong key' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form}>
      <Form.Field
        label={'Secret Key'}
        name="password"
        rules={{
          required: {
            value: true,
            message: 'Secret key is required',
          },
          // minLength: {
          //   value: 8,
          //   message: intl.formatMessage(
          //     { id: ETranslations.auth_error_password_too_short },
          //     {
          //       length: 8,
          //     },
          //   ),
          // },
          // maxLength: {
          //   value: 128,
          //   message: intl.formatMessage(
          //     {
          //       id: ETranslations.auth_erro_password_too_long,
          //     },
          //     {
          //       length: 128,
          //     },
          //   ),
          // },
          onChange: () => {
            form.clearErrors();
          },
        }}
      >
        <Input
          size="large"
          $gtMd={{
            size: 'medium',
          }}
          placeholder={'Enter your secret key...'}
          disabled={loading}
          autoFocus
          keyboardType={getPasswordKeyboardType(!secureEntry)}
          secureTextEntry={secureEntry}
          addOns={[
            {
              iconName: secureEntry ? 'EyeOutline' : 'EyeOffOutline',
              onPress: () => {
                setSecureEntry(!secureEntry);
              },
              testID: `password-eye-${secureEntry ? 'off' : 'on'}`,
            },
          ]}
          testID="password"
        />
      </Form.Field>
      <Button
        size="large"
        $gtMd={
          {
            size: 'medium',
          } as IButtonProps
        }
        variant="primary"
        loading={loading}
        onPress={form.handleSubmit(onSubmit)}
        testID="set-password"
      >
        Submit
      </Button>
    </Form>
  );
}

export function GetStarted({
  route,
}: IPageScreenProps<IOnboardingParamList, EOnboardingPages.GetStarted>) {
  const navigation = useAppNavigation();
  const intl = useIntl();
  const { showCloseButton } = route.params || {};
  const [myAccount, setMyAccount] = useAtom(myAccountAtom);
  const [isLoading, setLoading] = useState(false);

  const handleCreateWalletPress = async () => {
    // await backgroundApiProxy.servicePassword.promptPasswordVerify();
    // // navigation.push(EOnboardingPages.BeforeShowRecoveryPhrase);
    setLoading(true);
    let userInfo;
    try {
      await GoogleSignin.hasPlayServices();
      userInfo = await GoogleSignin.signIn();
      // const token = await GoogleSignin.getTokens();

      const responseToken = await axios.post(
        'https://langitapi.blockchainworks.id/api/clients/login',
        {
          'email': 'soul@yopmail.com',
          'password': 'testclient',
        },
      );

      const response = await axios.post(
        'https://langitapi.blockchainworks.id/api/accounts/google-auth',
        {
          google_code: userInfo?.serverAuthCode,
        },
        {
          headers: {
            Authorization: `Bearer ${responseToken?.data?.data?.accessToken}`,
          },
        },
      );

      const responseAccount = await axios.get(
        'https://langitapi.blockchainworks.id/api/accounts/' +
          response?.data?.data?.id,
        {
          headers: {
            Authorization: `Bearer ${response?.data?.data?.accessToken}`,
          },
        },
      );

      if (response?.status === 200) {
        setMyAccount({
          accountName: userInfo?.user?.name || '',
          email: userInfo?.user?.email,
          imageUrl: userInfo?.user?.photo || '',
          idToken: userInfo?.idToken || '',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          accessToken: response?.data?.data?.accessToken,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          refreshToken: response?.data?.data?.refreshToken,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          'address': response?.data?.data?.address,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          'accountAbstractionAddress':
            response?.data?.data?.accountAbstractionAddress,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          'shardDevice': response?.data?.data?.shardDevice,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ...responseAccount?.data?.data,
        });
        // // await GoogleSignin.signOut();
        // // await GoogleSignin.revokeAccess();
        navigation.navigate(ERootRoutes.Main);
      } else {
        await GoogleSignin.signOut();
        await GoogleSignin.revokeAccess();
      }
    } catch (error) {
      // @ts-ignore
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        console.error('user cancelled the login flow');
        // @ts-ignore
      } else if (error?.code === statusCodes.IN_PROGRESS) {
        console.error('operation (e.g. sign in) is in progress already');
        // @ts-ignore
      } else if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error('play services not available or outdated');
      } else {
        // @ts-ignore
        if (error?.response?.data?.code === 409) {
          // navigation.navigate(EOnboardingPages.GetStartedRecovery, {
          //   data: userInfo,
          // });
          const dialog = Dialog.show({
            tone: 'default',
            icon: 'InfoCircleOutline',
            title: 'Recover',
            description:
              'You need to enter your secret key to recover your account',
            renderContent: (
              <RecoveryInput
                userInfo={userInfo}
                onClose={() => dialog.close()}
              />
            ),
            showFooter: false,
          });
        }
        console.error('Some other error happened: ', error);
      }
      await GoogleSignin.signOut();
      await GoogleSignin.revokeAccess();
    } finally {
      setLoading(false);
    }
  };

  const handleImportWalletPress = async () => {
    navigation.push(EOnboardingPages.ImportWalletOptions);
  };

  const handleConnectHardwareWallet = async () => {
    navigation.push(EOnboardingPages.ConnectYourDevice);
  };

  const handleConnectWalletPress = async () => {
    navigation.push(EOnboardingPages.ConnectWalletSelectNetworks);
  };

  const handleTrackAnyAddressPress = async () => {
    navigation.push(EOnboardingPages.ImportAddress);
  };

  const termsLink = useHelpLink({ path: 'articles/360002014776' });
  const privacyLink = useHelpLink({ path: 'articles/360002003315' });

  const isDappMode = platformEnv.isWebDappMode;

  const renderAnchor = useCallback(
    (link: string, chunks: string[]) =>
      // Due to bugs such as the onPress event of the Text component,
      //  only the last of multiple Anchors will take effect.
      platformEnv.isNative ? (
        <View
          onPress={() => {
            openUrlExternal(link);
          }}
        >
          <SizableText
            left={platformEnv.isNativeIOS ? 20.5 : undefined}
            top={platformEnv.isNativeIOS ? 2.5 : 3.5}
            size="$bodySm"
          >
            {chunks[0]}
          </SizableText>
        </View>
      ) : (
        <Anchor
          href={link}
          size="$bodySm"
          color="$text"
          target="_blank"
          textDecorationLine="none"
        >
          {chunks}
        </Anchor>
      ),
    [],
  );

  const renderTermsTag: FormatXMLElementFn<string, any> = useCallback(
    (chunks: string[]) => renderAnchor(termsLink, chunks),
    [renderAnchor, termsLink],
  );

  const renderPrivacyTag: FormatXMLElementFn<string, any> = useCallback(
    (chunks: string[]) => renderAnchor(privacyLink, chunks),
    [privacyLink, renderAnchor],
  );

  return (
    <Page>
      <Page.Header headerShown={false} />
      <Page.Body>
        {showCloseButton ? (
          <Page.Close>
            <IconButton
              icon="CrossedLargeOutline"
              position="absolute"
              variant="tertiary"
              left="$5"
              top="$5"
              zIndex={1}
            />
          </Page.Close>
        ) : null}
        <Stack flex={1}>
          <ThemeableStack
            fullscreen
            alignItems="center"
            justifyContent="center"
          >
            <Image
              w={360}
              h={360}
              source={require('@onekeyhq/kit/assets/logo-press.png')}
            />
          </ThemeableStack>

          <Stack px="$5" pt="$10" mt="auto">
            <LinearGradient
              position="absolute"
              top="$0"
              left="$0"
              right="$0"
              bottom="$0"
              colors={['transparent', '$bgApp']}
              $platform-native={{
                display: 'none',
              }}
            />
            <Stack zIndex={1}>
              {/* Welcome to OneKey
              Simple, secure crypto management */}
              <Heading size="$heading4xl" textAlign="center">
                {intl.formatMessage({
                  id: ETranslations.onboarding_welcome_message,
                })}
              </Heading>
              <SizableText
                size="$bodyLg"
                textAlign="center"
                color="$textSubdued"
              >
                {intl.formatMessage({
                  id: ETranslations.onboarding_welcome_description,
                })}
              </SizableText>
            </Stack>
          </Stack>
        </Stack>
        <Stack
          py="$6"
          px="$5"
          space="$2.5"
          $gtMd={{
            maxWidth: '$96',
          }}
          alignSelf="center"
          w="100%"
        >
          {/* <ActionsGroup
            items={[
              {
                iconName: platformEnv.isNative
                  ? 'BluetoothOutline'
                  : 'UsbOutline',
                label: intl.formatMessage({
                  id: ETranslations.global_connect_hardware_wallet,
                }),
                primary: true,
                onPress: handleConnectHardwareWallet,
                testID: 'hardware-wallet',
              },
            ]}
          /> */}
          {!isDappMode ? (
            isLoading ? (
              <ActivityIndicator />
            ) : (
              <ActionsGroup
                items={[
                  {
                    iconName: 'PlusCircleOutline',
                    label: intl.formatMessage({
                      id: ETranslations.settings_sign_up_with_google,
                    }),
                    onPress: handleCreateWalletPress,
                    testID: 'create-wallet',
                  },
                  {
                    iconName: 'ArrowBottomCircleOutline',
                    label: intl.formatMessage({
                      id: ETranslations.global_import_wallet,
                    }),
                    onPress: handleImportWalletPress,
                    testID: 'import-wallet',
                  },
                ]}
              />
            )
          ) : null}
          {/* {isDappMode ? (
            <ActionsGroup
              items={[
                {
                  iconName: 'Link2Outline',
                  label: intl.formatMessage({
                    id: ETranslations.global_connect_wallet,
                  }),
                  onPress: handleConnectWalletPress,
                  testID: '3rd-party-wallet',
                },
                {
                  iconName: 'EyeOutline',
                  label: intl.formatMessage({
                    id: ETranslations.global_track_any_address,
                  }),
                  onPress: handleTrackAnyAddressPress,
                  testID: 'track-any-address',
                },
              ]}
            />
          ) : (
            <ActionsGroup
              items={[
                {
                  iconName: 'Link2Outline',
                  label: intl.formatMessage({
                    id: ETranslations.global_connect_wallet,
                  }),
                  onPress: handleConnectWalletPress,
                  testID: '3rd-party-wallet',
                },
              ]}
            />
          )} */}
        </Stack>
        <SizableText
          size="$bodySm"
          color="$textDisabled"
          textAlign="center"
          p="$5"
          pt="$0"
        >
          {intl.formatMessage(
            { id: ETranslations.terms_privacy },
            {
              termsTag: renderTermsTag,
              privacyTag: renderPrivacyTag,
            },
          )}
        </SizableText>
      </Page.Body>
    </Page>
  );
}

export default GetStarted;
