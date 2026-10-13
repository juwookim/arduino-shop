"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** localStorage 장바구니처럼 서버와 값이 다른 UI는 하이드레이션 이후에만 그린다. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
