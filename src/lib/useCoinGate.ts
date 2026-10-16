import { useEffect, useState, useCallback } from 'react';
import { getCoins, subscribeWallet, canAfford, chargeFeature, getFeatureCost, type CoinFeature } from './coins';

export function useCoinGate() {
  const [coins, setCoins] = useState(getCoins());
  const [gate, setGate] = useState<{ feature: CoinFeature; cost: number } | null>(null);

  useEffect(() => subscribeWallet((w) => setCoins(w.coins)), []);

  const trySpend = useCallback((feature: CoinFeature): boolean => {
    if (chargeFeature(feature)) {
      setCoins(getCoins());
      return true;
    }
    setGate({ feature, cost: getFeatureCost(feature) });
    return false;
  }, []);

  const canAffordFeature = useCallback((feature: CoinFeature): boolean => canAfford(getFeatureCost(feature)), []);

  const closeGate = useCallback(() => setGate(null), []);

  return { coins, gate, trySpend, canAffordFeature, closeGate };
}
