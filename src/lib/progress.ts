"use client";

import { useSyncExternalStore } from "react";
import { emptyProgress, migrate, type Progress } from "./srs";

// ponytail: tiến độ lưu trong localStorage (1 trình duyệt); thêm đăng nhập + database khi cần đồng bộ nhiều máy.
const KEY = "devinterview:progress:v1";
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Progress } = { raw: null, value: emptyProgress };

function read(): Progress {
  const raw = localStorage.getItem(KEY);
  if (raw !== cache.raw) {
    let value = emptyProgress;
    try {
      if (raw) value = migrate({ ...emptyProgress, ...JSON.parse(raw) });
    } catch {
      // dữ liệu hỏng -> coi như chưa có tiến độ
    }
    cache = { raw, value };
  }
  return cache.value;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb); // đồng bộ giữa các tab
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * Tiến độ hiện tại. Trả về null khi render ở server / lúc hydrate,
 * để phần phụ thuộc localStorage và ngày hôm nay chỉ hiện ở trình duyệt (tránh lệch HTML).
 */
export function useProgress(): Progress | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function updateProgress(fn: (p: Progress) => Progress) {
  localStorage.setItem(KEY, JSON.stringify(fn(read())));
  listeners.forEach((l) => l());
}
