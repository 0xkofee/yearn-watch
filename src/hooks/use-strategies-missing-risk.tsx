import { useEffect, useState } from 'react';
import { Network, Strategy } from '../types';
import { getStrategyTVLsPerProtocol } from '../utils';
import { getError } from '../utils/error';
import { initRiskFrameworkScores } from '../utils/risk-framework';

export function useStrategiesMissingRisk(network: Network) {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<Strategy[] | undefined>();

    useEffect(() => {
        const fetchVault = async () => {
            try {
                setLoading(true);
                const groupData = initRiskFrameworkScores(network);
                const justOthers = groupData.find((g) => g.id === 'others'); // get only uncategorized strategies
                const protocolTVL = await getStrategyTVLsPerProtocol(
                    justOthers!.id,
                    justOthers!.criteria.nameLike,
                    network as Network,
                    justOthers!.criteria.strategies,
                    justOthers!.criteria.exclude
                );

                const allStrategies = protocolTVL.strategies.filter(
                    (strategy) => {
                        return (
                            strategy.estimatedTotalAssetsUsdc.gt(0) &&
                            strategy.withdrawalQueueIndex !== -1
                        );
                    }
                );
                setData(allStrategies);
            } catch (e) {
                setError(getError(e));
                setData(undefined);
            } finally {
                setLoading(false);
            }
        };
        fetchVault();
    }, [network]);

    return {
        data,
        loading,
        error,
    };
}