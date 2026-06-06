import type { Address, PublicClient } from "viem";

import {
  CLAUDELANCE_CORE_ABI,
  CLAUDELANCE_CORE_V3_ABI,
} from "@yeheskieltame/claudelance-types";

/**
 * Read total protocol revenue for a token from the Claudelance Core.
 *
 * On v3 (UUPS proxy, EIP-7201 storage): reads via `getStatsV3(token)` which
 * returns the cumulative revenue as the second element.
 *
 * On v2 (immutable): reads the `totalProtocolRevenue(token)` public getter.
 *
 * Revenue is denominated in the token's smallest unit (wei for cUSD/CELO,
 * 1e-6 for USDC). Each resolved bounty contributes 2% of its amount, plus
 * any forfeited stakes.
 */
export async function getProtocolRevenue(
  client: PublicClient,
  core: Address,
  token: Address,
): Promise<bigint> {
  // Try v3 first: getStatsV3 returns (volume, revenue, resolved, posters, workers, countByType)
  try {
    const result = (await client.readContract({
      address: core,
      abi: CLAUDELANCE_CORE_V3_ABI,
      functionName: "getStatsV3",
      args: [token],
    })) as readonly [bigint, bigint, bigint, bigint, bigint, readonly bigint[]];
    return result[1]; // revenue is index 1
  } catch {
    // v2 fallback: public mapping getter
    return (await client.readContract({
      address: core,
      abi: CLAUDELANCE_CORE_ABI,
      functionName: "totalProtocolRevenue",
      args: [token],
    })) as bigint;
  }
}
