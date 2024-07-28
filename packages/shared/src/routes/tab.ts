import type { ITabHomeParamList } from '@onekeyhq/shared/src/routes';

import type { ITabMarketParamList } from './tabMarket';

export enum ETabRoutes {
  Home = 'Home',
  Market = 'Market',
  // Discovery = 'Discovery',
  // Me = 'Me',
  // Developer = 'Developer',
  // Swap = 'Swap',
  // MultiTabBrowser = 'MultiTabBrowser',
}

export type ITabStackParamList = {
  [ETabRoutes.Home]: ITabHomeParamList;
  // [ETabRoutes.Discovery]: ITabDiscoveryParamList;
  // [ETabRoutes.Me]: ITabMeParamList;
  // [ETabRoutes.Developer]: IDemoDeveloperTabParamList;
  [ETabRoutes.Market]: ITabMarketParamList;
  // [ETabRoutes.Swap]: ITabSwapParamList;
  // [ETabRoutes.MultiTabBrowser]: IMultiTabBrowserParamList;
};
