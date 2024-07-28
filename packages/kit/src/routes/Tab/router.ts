import type { ITabNavigatorConfig } from '@onekeyhq/components/src/layouts/Navigation/Navigator/types';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import { ETabRoutes } from '@onekeyhq/shared/src/routes';

import { homeRouters } from '../../views/Home/router';

import { marketRouters } from './Marktet/router';

type IGetTabRouterParams = {
  freezeOnBlur?: boolean;
};

export const getTabRouter = (params?: IGetTabRouterParams) => {
  const tabRouter: ITabNavigatorConfig<ETabRoutes>[] = [
    {
      name: ETabRoutes.Home,
      tabBarIcon: (focused?: boolean) =>
        focused ? 'WalletSolid' : 'WalletOutline',
      translationId: ETranslations.global_wallet,
      freezeOnBlur: false,
      rewrite: '/',
      exact: true,
      children: homeRouters,
    },
    {
      name: ETabRoutes.Market,
      tabBarIcon: (focused?: boolean) =>
        focused ? 'ChartTrendingUp2Solid' : 'ChartTrendingUp2Outline',
      translationId: ETranslations.global_market,
      freezeOnBlur: false,
      rewrite: '/market',
      exact: true,
      children: marketRouters,
    },
    // {
    //   name: ETabRoutes.Swap,
    //   tabBarIcon: (focused?: boolean) =>
    //     focused ? 'SwitchHorSolid' : 'SwitchHorOutline',
    //   translationId: ETranslations.global_swap,
    //   freezeOnBlur: Boolean(params?.freezeOnBlur),
    //   rewrite: '/swap',
    //   exact: true,
    //   children: swapRouters,
    // },
    // isShowMDDiscover ? getDiscoverRouterConfig(params) : undefined,
    // platformEnv.isDev
    //   ? {
    //       name: ETabRoutes.Me,
    //       rewrite: '/me',
    //       exact: true,
    //       tabBarIcon: (focused?: boolean) =>
    //         focused ? 'LayoutGrid2Solid' : 'LayoutGrid2Outline',
    //       translationId: ETranslations.global_more,
    //       freezeOnBlur: Boolean(params?.freezeOnBlur),
    //       children: meRouters,
    //     }
    //   : undefined,
    // platformEnv.isDev
    //   ? {
    //       name: ETabRoutes.Developer,
    //       tabBarIcon: (focused?: boolean) =>
    //         focused ? 'CodeBracketsSolid' : 'CodeBracketsOutline',
    //       translationId: ETranslations.global_dev_mode,
    //       freezeOnBlur: Boolean(params?.freezeOnBlur),
    //       rewrite: '/dev',
    //       exact: true,
    //       children: developerRouters,
    //     }
    //   : undefined,
    // isShowDesktopDiscover ? getDiscoverRouterConfig(params) : undefined,
  ].filter<any>((i): i is any => !!i);
  return tabRouter;
};
