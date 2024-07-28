import AsyncStorage from '@react-native-async-storage/async-storage';
import { atom } from 'jotai';

export const atomWithAsyncStorage = (key: string, initialValue: any) => {
  const baseAtom = atom(initialValue);
  baseAtom.onMount = (setValue) => {
    void (async () => {
      const item = await AsyncStorage.getItem(key);
      setValue(JSON.parse(item || '{}'));
    })();
  };
  const derivedAtom = atom(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (get) => get(baseAtom),
    (get, set, update) => {
      const nextValue =
        typeof update === 'function' ? update(get(baseAtom)) : update;
      set(baseAtom, nextValue);
      void AsyncStorage.setItem(key, JSON.stringify(nextValue));
    },
  );
  return derivedAtom;
};
