/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import get from 'lodash/get';
import noop from 'lodash/noop';
import React from 'react';
import { useSelector } from 'react-redux';
import { Box } from 'rendition';
import { Timeline, useSetup } from '@balena/jellyfish-ui-components';
import { useActions, useRouter, useTask } from '../hooks';
import {
	selectCurrentUser,
	selectMessages,
	selectCardById,
	selectGroups,
} from '../store/selectors';
import { FETCH_MORE_MESSAGES_LIMIT } from '../constants';

export const ChatRoute = () => {
	// Using an empty types array will effectively disable the autocomplete
	// trigger that uses the types
	const types = [];
	const { sdk, environment } = useSetup()!;
	const router = useRouter();
	const actions = useActions();
	const currentUser = useSelector(selectCurrentUser());
	const groups = useSelector(selectGroups());
	const loadThreadDataTask = useTask(actions.loadThreadData);

	const messages = useSelector(selectMessages(router.match.params.thread));

	const threadId = router.match.params.thread;
	const thread = useSelector(selectCardById(threadId));

	const query = {
		type: 'object',
		properties: {
			id: {
				const: threadId,
			},
		},
		$$links: {
			'has attached element': {
				type: 'object',
			},
		},
		required: ['id'],
	};

	React.useEffect(() => {
		loadThreadDataTask.exec(thread.slug, query, FETCH_MORE_MESSAGES_LIMIT);
	}, []);

	// ToDo: implement this
	const usersTyping = React.useMemo(() => {
		return {};
	}, []);

	const timelineHeaderOptions = React.useMemo(() => {
		return {
			title: get(thread, ['name']),
			buttons: {
				toggleWhispers: false,
				toggleEvents: false,
			},
		};
	}, [thread]);

	const handleCardVisible = React.useCallback(
		async (card) => {
			const notifications = await sdk.query({
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
						required: ['id'],
						properties: {
							id: {
								const: card.id,
							},
						},
					},
				},
			});

			await Promise.all(
				notifications.map(async (notification) => {
					await sdk.card.link(currentUser, notification, 'read');
				}),
			);
		},
		[sdk, currentUser],
	);

	return (
		<Box
			flex={1}
			style={{
				position: 'relative',
			}}
			data-test="chat-page"
			data-test-id={thread.id}
		>
			<Box
				style={{
					position: 'absolute',
					width: '100%',
					height: '100%',
				}}
			>
				<Timeline
					enableAutocomplete={!environment.isTest()}
					sdk={sdk}
					types={types}
					groups={groups}
					wide={false}
					allowWhispers={false}
					card={thread}
					tail={messages}
					usersTyping={usersTyping}
					user={currentUser}
					getActor={actions.getActor}
					signalTyping={noop}
					setTimelineMessage={noop}
					eventMenuOptions={false}
					headerOptions={timelineHeaderOptions}
					loadMoreChannelData={actions.loadMoreThreadData}
					onCardVisible={handleCardVisible}
				/>
			</Box>
		</Box>
	);
};
