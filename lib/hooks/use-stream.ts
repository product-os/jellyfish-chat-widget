import * as React from 'react';
import { v4 as uuid } from 'uuid';
import * as skhema from 'skhema';
import getProperty from 'lodash/get';
import { useSetup } from '@balena/jellyfish-ui-components';
import { JSONSchema, core } from '@balena/jellyfish-types';
import {
	ExtendedSocket,
	SdkQueryOptions,
} from '@balena/jellyfish-client-sdk/build/types';

const applyUpdates = (items: any[], updates: any[]) => {
	const results = [...items];

	while (updates.length) {
		const { type, after } = updates[0];

		switch (type) {
			case 'insert':
			case 'update':
				for (let i = 0; i < results.length; i++) {
					if (results[i].id === after.id) {
						results[i] = after;
					}
				}
			case 'unmatch':
				for (let i = 0; i < results.length; i++) {
					if (results[i].id === after.id) {
						results.splice(i, 1);
					}
				}
		}

		updates.splice(0, 1);
	}

	return results;
};

export const useStream = <TContract extends core.Contract>(
	query: JSONSchema,
	queryOptions: Omit<SdkQueryOptions, 'limit'>,
) => {
	const { sdk } = useSetup()!;
	const [contracts, setContracts] = React.useState<TContract[]>([]);
	const streamRef = React.useRef<ExtendedSocket>();
	const sortBy = queryOptions.sortBy
		? ([] as string[]).concat(queryOptions.sortBy, 'id')
		: ['id'];

	const next = React.useCallback(
		(count) => {
			let stream = streamRef.current;
			const updates: any[] = [];
			let accumulate = true;

			if (stream) {
				stream.emit('setSchema', {
					data: {
						schema: query,
					},
				});
			} else {
				stream = streamRef.current = sdk.stream(query);

				stream.on('update', (data) => {
					if (accumulate) {
						updates.push(data);
					} else {
						setContracts(applyUpdates(contracts, updates));
					}
				});
			}

			const queryId = uuid();
			{
				const lastContract = contracts[contracts.length - 1];

				stream.emit('queryDataset', {
					data: {
						id: queryId,
						schema: lastContract
							? skhema.merge([
									query as any,
									{
										anyOf: sortBy.map((_, index) => {
											return {
												allOf: [
													...sortBy.slice(0, index).map((field) => {
														return {
															type: 'object',
															properties: {
																[field]: {
																	const: getProperty(lastContract, field),
																},
															},
														};
													}),
													...sortBy.slice(index, index + 1).map((field) => {
														return {
															type: 'object',
															properties: {
																[field]: {
																	exclusiveMinimum: getProperty(
																		lastContract,
																		field,
																	),
																},
															},
														};
													}),
												],
											};
										}),
									},
							  ])
							: query,
						options: {
							...queryOptions,
							limit: count,
							sortBy,
						},
					},
				});
			}

			return new Promise<void>((resolve) => {
				stream!.on('dataset', ({ data }) => {
					if (queryId !== data.id) {
						return;
					}

					const allContracts = contracts.concat(data.cards);
					const lastContract = allContracts[allContracts.length - 1];

					stream!.emit('setSchema', {
						data: {
							schema: lastContract
								? skhema.merge([
										query as any,
										...sortBy.map((field) => {
											return {
												type: 'object',
												required: [field],
												properties: {
													[field]: {
														maximum: getProperty(lastContract, field),
													},
												},
											};
										}),
								  ])
								: query,
						},
					});

					setContracts(applyUpdates(allContracts, updates));
					accumulate = false;
					resolve();
				});
			});
		},
		[contracts],
	);

	return [contracts, next];
};
