/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import React from 'react';
import { useStore } from 'react-redux';
import { useSetup } from '@balena/jellyfish-ui-components';
import * as actionCreators from '../store/action-creators';
import { useStream } from './use-stream';

export const useActions = (): any => {
	const store = useStore();
	const { sdk } = useSetup()!;
	const stream = useStream();

	return React.useMemo(() => {
		return Object.keys(actionCreators).reduce((actions, method) => {
			actions[method] = actionCreators[method]({
				store,
				sdk,
				stream,
			});
			return actions;
		}, {});
	}, [store, sdk]);
};
