import { atom } from 'jotai';
import { atomWithAsyncStorage } from './atomWithStorage';

export const myAccountAtom = atomWithAsyncStorage('myAccounts', {
  accountName: '',
  imageUrl: '',
  email: '',
  idToken: '',
  accessToken: '',
  refreshToken: '',
  address: '',
  shardDevice: '',
});
