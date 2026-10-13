"use client";

import { useEffect, useState, type DependencyList } from "react";

type State<T> = { key: string | null; data?: T; error?: string };

/**
 * 브라우저에서 데이터를 불러오는 작은 훅. deps가 바뀌면 다시 불러온다.
 * deps는 JSON으로 직렬화할 수 있는 값만 넣는다.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList) {
  const key = JSON.stringify(deps);
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<State<T>>({ key: null });
  const requestKey = `${key}#${nonce}`;

  useEffect(() => {
    let cancelled = false;
    fn().then(
      (data) => !cancelled && setState({ key: requestKey, data }),
      (e: unknown) =>
        !cancelled && setState({ key: requestKey, error: e instanceof Error ? e.message : "불러오지 못했습니다." }),
    );
    return () => {
      cancelled = true;
    };
    // fn은 deps로 결정되므로 requestKey만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const fresh = state.key === requestKey;
  return {
    data: fresh ? state.data : undefined,
    error: fresh ? state.error : undefined,
    loading: !fresh,
    reload: () => setNonce((n) => n + 1),
  };
}
