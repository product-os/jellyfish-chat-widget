import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuid } from 'uuid';
import { JSONSchema } from '@balena/jellyfish-types';
import { useSetup } from '@balena/jellyfish-ui-components';
import { SET_CARDS, DELETE_CARD } from '../store/action-types';
import {
	areEqualArrayOfContracts,
	selectNotifications,
	selectProduct,
} from '../store/selectors';
import { useTask } from './use-task';

export const useNotificationWatcher = ({ onNotificationsChange }) => {
	const { sdk } = useSetup()!;
	const dispatch = useDispatch();
	const product = useSelector(selectProduct());
	const notifications = useSelector(
		selectNotifications(),
		areEqualArrayOfContracts,
	);
	const streamRef = React.useRef<any>(null);
	const unmountedRef = React.useRef(false);

	const task = useTask(async (currentUser) => {
		const query: JSONSchema = {
			type: 'object',
			required: ['type'],
			properties: {
				type: {
					const: 'notification@1.0.0',
				},
			},
			$$links: {
				'is attached to': {
					type: 'object',
					required: ['type'],
					properties: {
						type: {
							const: 'message@1.0.0',
						},
					},
					$$links: {
						'is attached to': {
							required: ['type', 'data'],
							properties: {
								type: {
									const: 'support-thread@1.0.0',
								},
								data: {
									type: 'object',
									required: ['product'],
									properties: {
										product: {
											const: product,
										},
									},
								},
							},
						},
					},
				},
			},
			not: {
				$$links: {
					'is read by': {
						type: 'object',
						required: ['type', 'id'],
						properties: {
							type: {
								const: 'user@1.0.0',
							},
							id: {
								const: currentUser.id,
							},
						},
					},
				},
			},
		};

		streamRef.current = await sdk.stream(query);

		if (unmountedRef.current) {
			streamRef.current?.close();
			return;
		}

		streamRef.current.emit('queryDataset', {
			data: {
				id: uuid(),
				schema: query,
			},
		});

		streamRef.current.on('dataset', ({ data: { cards } }) => {
			dispatch({
				type: SET_CARDS,
				payload: cards,
			});
		});

		streamRef.current.on('update', ({ data, error }) => {
			if (error) {
				console.error(error);
				return;
			}

			if (data.after) {
				dispatch({
					type: SET_CARDS,
					payload: [data.after],
				});
			} else {
				dispatch({
					type: DELETE_CARD,
					payload: data.id,
				});
			}
		});
	});

	React.useEffect(() => {
		return () => {
			unmountedRef.current = true;

			if (streamRef.current) {
				streamRef.current.close();
			}
		};
	}, []);

	React.useEffect(() => {
		if (onNotificationsChange) {
			onNotificationsChange(notifications);
		}
	}, [notifications]);

	return task;
};
