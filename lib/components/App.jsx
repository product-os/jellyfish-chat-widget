/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import React from 'react'
import {
	Provider as StoreProvider
} from 'react-redux'
import {
	MemoryRouter as Router, Route
} from 'react-router-dom'
import {
	useSetup
} from '@balena/jellyfish-ui-components/lib/SetupProvider'
import {
	IndexRoute,
	ChatRoute,
	FullThreadListRoute,
	NewThreadRoute
} from '../routes'
import {
	createStore
} from '../store'
import {
	Layout
} from './Layout'
import {
	StreamProviderTask
} from './StreamProviderTask'

export const App = React.memo(({
	productTitle,
	product,
	inbox,
	onClose
}) => {
	const {
		environment
	} = useSetup()

	const	query = React.useMemo(() => {
		return {
			$$links: {
				'has attached element': {
					type: 'object',
					additionalProperties: true
				}
			},
			properties: {
				links: {
					type: 'object',
					additionalProperties: true
				},
				type: {
					const: 'support-thread@1.0.0'
				},
				active: {
					const: true
				},
				data: {
					properties: {
						product: {
							const: product
						}
					},
					required: [
						'product'
					]
				}
			},
			additionalProperties: true
		}
	}, [ product ])

	const store = React.useMemo(() => {
		return createStore({
			product,
			productTitle,
			inbox,
			query
		}, {
			environment
		})
	}, [ product, productTitle, inbox, query, environment ])

	return (
		<StoreProvider store={store}>
			<StreamProviderTask>
				{() => {
					return (
						<Router>
							<Layout flex={1} onClose={onClose}>
								<Route path="/" exact component={IndexRoute} />
								<Route path="/full_thread_list" exact component={FullThreadListRoute} />
								<Route path="/new_thread" exact component={NewThreadRoute} />
								<Route path="/chat/:thread" exact component={ChatRoute} />
							</Layout>
						</Router>
					)
				}}
			</StreamProviderTask>
		</StoreProvider>
	)
})
