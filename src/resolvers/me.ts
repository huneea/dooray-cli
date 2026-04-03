import { DoorayApiClient } from "../api/client.js";
import type { CachedMe } from "../cache/types.js";
import { getMe, setMe, isExpired } from "../cache/store.js";
import { ME_TTL_MS } from "../cache/types.js";

export async function ensureMe(client: DoorayApiClient): Promise<CachedMe> {
  const entry = await getMe();
  if (entry && !isExpired(entry.updatedAt, ME_TTL_MS)) {
    return entry.data;
  }
  const res = await client.getMe();
  const me: CachedMe = { id: res.result.id, name: res.result.name };
  await setMe(me);
  return me;
}
