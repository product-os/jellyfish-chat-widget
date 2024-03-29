import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Flex } from 'rendition';
import { InfiniteList } from '@balena/jellyfish-ui-components';
import { FETCH_MORE_CONVERSATIONS_LIMIT } from '../constants';
import { ButtonLink } from '../components/button-link';
import { Loader } from '../components/loader';
import { ThreadListItem } from '../components/thread-list-item';
import { useActions, useTask } from '../hooks';
import { selectThreads } from '../store/selectors';

export const FullThreadListRoute = () => {
	const actions = useActions();
	const threads = useSelector(selectThreads());
	const fetchMoreThreadsTask = useTask(actions.fetchThreads);

	const handleScrollEnding = React.useCallback(async () => {
		await fetchMoreThreadsTask.exec({
			limit: FETCH_MORE_CONVERSATIONS_LIMIT,
		});
	}, []);

	return (
		<Flex
			flexDirection="column"
			flex={1}
			alignItems="center"
			data-test="full-conversation-list-page"
		>
			<Box
				flex={1}
				alignSelf="stretch"
				style={{
					position: 'relative',
				}}
			>
				<InfiniteList
					onScrollEnding={handleScrollEnding}
					style={{
						position: 'absolute',
						width: '100%',
						height: '100%',
					}}
				>
					{threads.map((thread) => {
						return <ThreadListItem key={thread.id} thread={thread} />;
					})}
					<Loader
						style={{
							visibility: fetchMoreThreadsTask.started ? 'visible' : 'hidden',
						}}
					/>
				</InfiniteList>
			</Box>
			<Box p={30}>
				<ButtonLink
					primary
					to="/new_thread"
					data-test="start-new-conversation-button"
				>
					Start new conversation
				</ButtonLink>
			</Box>
		</Flex>
	);
};
