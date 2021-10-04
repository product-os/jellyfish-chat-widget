/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import React from 'react';
import { Box, Flex } from 'rendition';
import { CreateThread } from '../components/create-thread';
import { Heading } from '../components/heading';
import { useRouter } from '../hooks';

export const NewThreadRoute = () => {
	const router = useRouter();

	const handleSuccess = React.useCallback(({ thread }) => {
		router.history.replace(`/chat/${thread.id}`);
	}, []);

	return (
		<Flex
			flex={1}
			p={16}
			flexDirection="column"
			alignItems="center"
			data-test="create-new-conversation-page"
		>
			<Box>
				<Heading
					primaryText="Welcome"
					secondaryText="Our 2021 annual summit is taking place between October 4th and October 8th. We will respond to messages as quickly as possible, but please note we may be a little slower than usual."
				/>
			</Box>
			<Box alignSelf="stretch">
				<CreateThread onSuccess={handleSuccess} />
			</Box>
		</Flex>
	);
};
