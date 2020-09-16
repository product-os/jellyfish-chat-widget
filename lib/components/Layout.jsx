/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import React from 'react'
import {
	Flex, useTheme
} from 'rendition'
import styled from 'styled-components'
import {
	px
} from '@balena/jellyfish-ui-components/lib/services/helpers'
import {
	Task
} from './Task'
import {
	useActions,
	useCombineTasks,
	useTask
} from '../hooks'
import {
	INITIAL_FETCH_CONVERSATIONS_LIMIT
} from '../constants'
import {
	Header
} from './Header'

const ChatWrapper = styled(Flex) `
	p {
		margin-top: 0;
		margin-bottom: ${(props) => { px(props.theme.space[2]) }};
	}
	p:last-child {
		margin-bottom: 0;
	}
`

export const Layout = ({
	onClose, children, ...rest
}) => {
	const actions = useActions()
	const fetchThreads = useTask(actions.fetchThreads)
	const setCurrentUser = useTask(actions.setCurrentUser)
	const setGroups = useTask(actions.setGroups)
	const combinedTask = useCombineTasks(fetchThreads, setCurrentUser)
	const theme = useTheme()

	React.useEffect(() => {
		fetchThreads.exec({
			limit: INITIAL_FETCH_CONVERSATIONS_LIMIT
		})

		setCurrentUser.exec()
		setGroups.exec()
	}, [])

	return (
		<ChatWrapper {...rest}
			flexDirection="column"
			color={theme.colors.secondary.main}
			backgroundColor={theme.colors.quartenary.light}
			style={{
				overflow: 'hidden'
			}}>
			<Header onClose={onClose} />
			<Flex
				flex={1}
				flexDirection="column"
				style={{
					overflow: 'hidden'
				}}>
				<Task task={combinedTask}>{() => { return children }}</Task>
			</Flex>
		</ChatWrapper>
	)
}
