/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import React from 'react'
import {
	CardLoaderContext
} from '@balena/jellyfish-ui-components'
import {
	selectCardById
} from '../store/selectors'
import {
	useActions
} from '../hooks'

export const CardLoaderContextProvider = React.memo(({
	children
}) => {
	const actions = useActions()

	const cardLoaderCtx = React.useMemo(() => {
		return {
			getCard: actions.getCard,
			selectCard: (id, type) => {
				return (state) => {
					return selectCardById(id)(state)
				}
			}
		}
	}, [ actions ])

	return (
		<CardLoaderContext.Provider value={cardLoaderCtx}>
			{children}
		</CardLoaderContext.Provider>
	)
})