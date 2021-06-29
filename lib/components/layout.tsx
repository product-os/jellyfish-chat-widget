/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import React from 'react';
import { Flex, useTheme } from 'rendition';
import styled from 'styled-components';
import { helpers } from '@balena/jellyfish-ui-components';
import { Task } from './task';
import {
	useActions,
	useCombineTasks,
	useTask,
	useNotificationWatcher,
} from '../hooks';
import { INITIAL_FETCH_CONVERSATIONS_LIMIT } from '../constants';
import { Header } from './header';

const ChatWrapper = styled(Flex)`
	p {
		margin-top: 0;
		margin-bottom: ${(props) => {
			return helpers.px(props.theme.space[2]);
		}};
	}
	p:last-child {
		margin-bottom: 0;
	}
`;

export const Layout = ({ onClose, children, ...rest }) => {
	const actions = useActions();
	const fetchThreads = useTask(actions.fetchThreads);
	const setCurrentUser = useTask(actions.setCurrentUser);
	const setGroups = useTask(actions.setGroups);
	const watchNotifications = useNotificationWatcher();
	const combinedTask = useCombineTasks(
		fetchThreads,
		setCurrentUser,
		watchNotifications,
	);
	const theme = useTheme();

	React.useEffect(() => {
		(async () => {
			fetchThreads.exec({
				limit: INITIAL_FETCH_CONVERSATIONS_LIMIT,
			});

			setGroups.exec();
			const { result } = await setCurrentUser.exec();
			watchNotifications.exec(result);
		})();
	}, []);

	return (
		<ChatWrapper
			{...rest}
			flexDirection="column"
			color={theme.colors.secondary.main}
			backgroundColor={theme.colors.quartenary.light}
			style={{
				overflow: 'hidden',
			}}
		>
			<Header onClose={onClose} />
			<Flex
				flex={1}
				flexDirection="column"
				style={{
					overflow: 'hidden',
				}}
			>
				<Task task={combinedTask}>
					{() => {
						return children;
					}}
				</Task>
			</Flex>
		</ChatWrapper>
	);
};
