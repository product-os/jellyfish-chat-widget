/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { CardChatSummary } from '@balena/jellyfish-ui-components';
import { useActions } from '../hooks';
import {
	selectMessages,
	selectNotificationsByThread,
} from '../store/selectors';

export const ThreadListItem = ({ thread, ...rest }) => {
	const actions = useActions();
	const timeline = useSelector(selectMessages(thread.id));
	const notifications = useSelector(selectNotificationsByThread(thread.id));

	return (
		<CardChatSummary
			{...rest}
			displayOwner={false}
			getActor={actions.getActor}
			card={thread}
			timeline={timeline}
			to={`/chat/${thread.id}`}
			active={notifications.length}
		/>
	);
};
