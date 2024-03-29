import React from 'react';
import { Provider as StoreProvider } from 'react-redux';
import { MemoryRouter as Router, Route } from 'react-router-dom';
import { useSetup } from '@balena/jellyfish-ui-components';
import {
	IndexRoute,
	ChatRoute,
	FullThreadListRoute,
	NewThreadRoute,
} from '../routes';
import { createStore } from '../store';
import { Layout } from './layout';
import { CardLoaderContextProvider } from './card-loader-context-provider';

export const App = React.memo<any>(
	({
		productTitle,
		product,
		inbox,
		initialUrl,
		onClose,
		onNotificationsChange,
	}) => {
		const { environment } = useSetup()!;

		const store = React.useMemo(() => {
			return createStore(
				{
					product,
					productTitle,
					inbox,
				},
				{
					environment,
				},
			);
		}, [product, productTitle, inbox, environment]);

		return (
			<StoreProvider store={store}>
				<CardLoaderContextProvider>
					<Router>
						<Layout
							flex={1}
							initialUrl={initialUrl}
							onClose={onClose}
							onNotificationsChange={onNotificationsChange}
						>
							<Route path="/" exact component={IndexRoute} />
							<Route
								path="/full_thread_list"
								exact
								component={FullThreadListRoute}
							/>
							<Route path="/new_thread" exact component={NewThreadRoute} />
							<Route path="/chat/:thread" exact component={ChatRoute} />
						</Layout>
					</Router>
				</CardLoaderContextProvider>
			</StoreProvider>
		);
	},
);
