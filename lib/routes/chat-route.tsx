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
	selectNotificationsByThread,
} from '../store/selectors';
import { FETCH_MORE_MESSAGES_LIMIT } from '../constants';
import { Task } from '../components/task';

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
	const threadId = router.match.params.thread;
	const messages = useSelector(selectMessages(threadId));
	const thread = useSelector(selectCardById(threadId));
	const notifications = useSelector(selectNotificationsByThread(threadId));

	React.useEffect(() => {
		loadThreadDataTask.exec(threadId, FETCH_MORE_MESSAGES_LIMIT);
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

	return (
		<Task task={loadThreadDataTask}>
			{() => {
				if (!thread) {
					return null;
				}

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
								notifications={notifications}
							/>
						</Box>
					</Box>
				);
			}}
		</Task>
	);
};
