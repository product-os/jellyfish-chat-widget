/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import React from 'react'
import {
	useSelector
} from 'react-redux'
import CardChatSummary from '@balena/jellyfish-ui-components/lib/CardChatSummary'
import {
	useActions
} from '../hooks'
import {
	selectMessages,
	selectCardById
} from '../store/selectors'

export const ThreadListItem = ({
	thread,
	...rest
}) => {
	const actions = useActions()
	const timeline = useSelector(selectMessages(thread.id))

	return (
		<CardChatSummary
			{...rest}
			displayOwner={false}
			selectCard={(id, type) => {
				return (state) => {
					return selectCardById(id)(state)
				}
			}}
			getCard={actions.getCard}
			getActor={actions.getActor}
			card={thread}
			timeline={timeline}
			to={`/chat/${thread.id}`}
			active={false}
		/>
	)
}
