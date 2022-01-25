import * as React from 'react';
import { v4 as uuid } from 'uuid';
import { useSetup } from '@balena/jellyfish-ui-components';
import { JSONSchema, core } from '@balena/jellyfish-types';
import {
	ExtendedSocket,
	SdkQueryOptions,
} from '@balena/jellyfish-client-sdk/build/types';

interface UseStreamQueryOptions extends SdkQueryOptions {
	loadMoreLimit: number;
}

export const useStream = <TContract extends core.Contract>(
	query: JSONSchema,
	{ loadMoreLimit, ...queryOptions }: UseStreamQueryOptions,
) => {
	const { sdk } = useSetup()!;
	const [contracts, setContracts] = React.useState<TContract[]>([]);
	const streamRef = React.useRef<ExtendedSocket>();

	React.useEffect(() => {
		const stream = (streamRef.current = sdk.stream(query));
		const queryId = uuid();

		stream.on('dataset', ({ data }) => {
			if (queryId === data.id) {
				setContracts(data.contracts);
			}
		});

		stream.on('update', ({ data: { type, after: card } }) => {
			if (type === 'update' || type === 'insert') {
				// ...
			}
		});

		stream.emit('queryDataset', {
			data: {
				id: queryId,
				schema: query,
				options: queryOptions,
			},
		});

		return () => {
			stream.close();
		};
	}, []);

	const loadMoreContracts = React.useCallback(() => {
		const queryId = uuid();
		const stream = streamRef.current!;

		streamRef.current!.emit('queryDataset', {
			data: {
				id: queryId,
				schema: query,
				options: {
					...queryOptions,
					skip: contracts.length,
					limit: loadMoreLimit,
				},
			},
		});

		stream.on('dataset', ({ data }) => {
			if (queryId === data.id) {
				setContracts([...contracts, ...data.contracts]);
			}
		});
	}, [contracts.length]);

	return [contracts, loadMoreContracts];
};
