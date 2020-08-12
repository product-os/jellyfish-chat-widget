/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import React from 'react'
import {
	useStore
} from 'react-redux'
import {
	useSetup
} from '@balena/jellyfish-ui-components/lib/SetupProvider'
import {
	streamContext
} from '../components/StreamProviderTask'
import {
	SET_CARDS
} from '../store/action-types'
import {
	useTask
} from './use-task'

const useSetupStreamFactory = () => {
	const {
		sdk
	} = useSetup()
	const store = useStore()
	const state = store.getState()

	return React.useCallback(async () => {
		const stream = await sdk.stream(state.query)

		stream.on('update', ({
			data, error
		}) => {
			if (error) {
				console.error(error)
				return
			}

			if (data.type === 'update' || data.type === 'insert') {
				store.dispatch({
					type: SET_CARDS,
					payload: [ data.after ]
				})
			}
		})
		return stream
	}, [ sdk, store ])
}

export const useSetupStreamTask = () => {
	return useTask(useSetupStreamFactory())
}

export const useStream = () => {
	return React.useContext(streamContext)
}
