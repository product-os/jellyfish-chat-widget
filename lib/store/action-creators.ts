/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import compact from 'lodash/compact';
import every from 'lodash/every';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import orderBy from 'lodash/orderBy';
import { v4 as uuid } from 'uuid';
import { helpers, FILE_PROXY_MESSAGE } from '@balena/jellyfish-ui-components';
import { SET_CARDS, SET_CURRENT_USER, SET_GROUPS } from './action-types';
import { selectCardById, selectCurrentUser, selectThreads } from './selectors';

const allGroupsWithUsersQuery = {
	type: 'object',
	description: 'Get all groups with member user slugs',
	required: ['type', 'name'],
	$$links: {
		'has group member': {
			type: 'object',
			required: ['slug'],
			properties: {
				slug: {
					type: 'string',
				},
			},
			additionalProperties: false,
		},
	},
	properties: {
		type: {
			const: 'group@1.0.0',
		},
	},
};

//
// Card exists here until it's loaded
const loadingCardCache = {};

// TODO cleanup once we have pagination built into our streams
const streams = {};

// TODO cleanup once we have pagination built into our streams
const hashCode = (input) => {
	let hash: any = 0;
	let iteration = 0;
	let character = '';
	if (input.length === 0) {
		return hash;
	}
	for (iteration; iteration < input.length; iteration++) {
		character = input.charCodeAt(iteration);

		// tslint:disable-next-line: no-bitwise
		hash = (hash << 5) - hash + character;

		// Convert to 32bit integer
		// tslint:disable-next-line: no-bitwise
		hash |= 0;
	}
	return hash;
};

// TODO cleanup once we have pagination built into our streams
const getStream = (ctx) => {
	return async (streamId, query) => {
		if (streams[streamId]) {
			streams[streamId].close();
			Reflect.deleteProperty(streams, streamId);
		}

		const stream = await ctx.sdk.stream(query);
		streams[streamId] = stream;
		return stream;
	};
};

export const setCards = (ctx) => {
	return (cards) => {
		ctx.store.dispatch({
			type: SET_CARDS,
			payload: cards,
		});
	};
};

export const initiateThread = (ctx) => {
	return async ({ subject, text, files }) => {
		const state = ctx.store.getState();
		const currentUser = selectCurrentUser()(state);
		const markers = [`${currentUser.slug}+org-balena`];

		const thread = await ctx.sdk.card.create({
			type: 'support-thread',
			name: subject,
			markers,
			data: {
				inbox: state.inbox,
				product: state.product,
				status: 'open',
			},
		});

		const messageSymbolRE = /^\s*%\s*/;
		const {
			mentionsUser,
			alertsUser,
			mentionsGroup,
			alertsGroup,
			tags,
		} = helpers.getMessageMetaData(text);

		const newMessage: any = {
			target: thread,
			type: 'message',
			slug: `message-${uuid()}`,
			tags,
			payload: {
				mentionsUser,
				alertsUser,
				mentionsGroup,
				alertsGroup,
				message: helpers.replaceEmoji(text.replace(messageSymbolRE, '')),
			},
		};

		if (files.length) {
			newMessage.payload.file = files[0];
			newMessage.payload.message += `\n${FILE_PROXY_MESSAGE} ${helpers.createPermaLink(
				thread,
			)}`;
		}

		const message = await ctx.sdk.event.create(newMessage);

		return {
			thread,
			message,
		};
	};
};

export const fetchThreads = (ctx) => {
	return async ({ limit }) => {
		const state = ctx.store.getState();

		ctx.stream.emit('queryDataset', {
			data: {
				schema: state.query,
				options: {
					skip: selectThreads()(state).length,
					limit,
					sortBy: ['created_at'],
					sortDir: 'desc',
					links: {
						limit,
						sortBy: ['created_at'],
						sortDir: 'desc',
					},
				},
			},
		});

		return new Promise<void>((resolve) => {
			ctx.stream.once('dataset', ({ data: { cards } }) => {
				setCards(ctx)(cards);
				resolve();
			});
		});
	};
};

export const setCurrentUser = (ctx) => {
	return async () => {
		const currentUser = await ctx.sdk.auth.whoami();

		ctx.store.dispatch({
			type: SET_CURRENT_USER,
			payload: currentUser,
		});
	};
};

export const setGroups = (ctx) => {
	return async () => {
		const groups = await ctx.sdk.query(allGroupsWithUsersQuery);
		ctx.store.dispatch({
			type: SET_GROUPS,
			payload: groups,
		});
	};
};

export const getActor = (ctx) => {
	return async (id) => {
		const actor = await getCard(ctx)(id, 'user', ['is member of']);
		const state = ctx.store.getState();

		if (!actor) {
			return null;
		}

		const email = get(actor, ['data', 'email'], '');

		let name = '';

		/* Get user name to display with priorities:
		 * 1. profile.name
		 * 2. email
		 * 3. slug
		 */
		const profileName = get(actor, ['data', 'profile', 'name']);

		if (profileName && (profileName.first || profileName.last)) {
			name = compact([profileName.first, profileName.last]).join(' ');
		} else if (email && email.length) {
			name = isArray(email) ? email.join(', ') : email;
		} else {
			name = actor.slug.replace(/^(account|user)-/, '');
		}

		const currentUser = selectCurrentUser()(state);

		return {
			name,
			email,
			avatarUrl: get(actor, ['data', 'avatar']),
			proxy: actor.id !== get(currentUser, ['id']),
			card: actor,
		};
	};
};

export const getCard = (ctx) => {
	// Type argument is included to keep this method signature
	// the same as the corresponding Jellyfish action
	return async (id, _type, linkVerbs: any[] = []) => {
		const state = ctx.store.getState();
		let card = selectCardById(id)(state);

		// Check if the cached card has all the links required by this request
		const isCached =
			card &&
			every(linkVerbs, (linkVerb) => {
				return Boolean(get(card, ['links'], {})[linkVerb]);
			});

		if (!isCached) {
			// API requests are debounced based on the unique combination of the card ID and the (sorted) link verbs
			const linkVerbSlugs = orderBy(linkVerbs).map((verb) => {
				return helpers.slugify(verb);
			});
			const loadingCacheKey = [id].concat(linkVerbSlugs).join('_');
			if (!Reflect.has(loadingCardCache, loadingCacheKey)) {
				const schema: any = {
					type: 'object',
					properties: {
						id: {
							const: id,
						},
					},
					additionalProperties: true,
				};

				if (linkVerbs.length) {
					schema.$$links = {};
					for (const linkVerb of linkVerbs) {
						schema.$$links[linkVerb] = {
							type: 'object',
							additionalProperties: true,
						};
					}
				}

				loadingCardCache[loadingCacheKey] = ctx.sdk
					.query(schema, {
						limit: 1,
					})
					.then((result) => {
						if (result.length) {
							return result[0];
						}
						return ctx.sdk.card.get(id);
					})
					.finally(() => {
						Reflect.deleteProperty(loadingCardCache, loadingCacheKey);
					});
			}

			card = await loadingCardCache[loadingCacheKey];

			setCards(ctx)([card]);
		}
		return card;
	};
};

// TODO make stream setup part of use-stream hook
export const loadThreadData = (ctx) => {
	return async (thread, query, limit) => {
		const streamHash = hashCode(thread);
		const stream = await getStream(ctx)(streamHash, query);

		stream.on('dataset', ({ data: { cards } }) => {
			setCards(cards);
		});

		stream.on('update', ({ data: { type, after: card } }) => {
			if (type === 'update' || type === 'insert') {
				setCards(ctx)([card]);
			}
		});

		stream.emit('queryDataset', {
			data: {
				id: uuid(),
				schema: query,
				options: {
					links: {
						'has attached element': {
							sortBy: 'created_at',
							sortDir: 'desc',
							limit,
						},
					},
				},
			},
		});
	};
};

// TODO cleanup once we have pagination built into our streams
export const loadMoreThreadData = () => {
	return async ({ target, query, queryOptions }) => {
		const streamHash = hashCode(target);
		const stream = streams[streamHash];
		if (!stream) {
			throw new Error(
				'Stream not found: Did you forget to call loadChannelData?',
			);
		}
		const queryId = uuid();
		stream.emit('queryDataset', {
			data: {
				id: queryId,
				schema: query,
				options: queryOptions,
			},
		});
		return new Promise((resolve) => {
			const handler = ({ data }) => {
				if (data.id === queryId) {
					resolve(data.cards);
					stream.off('dataset', handler);
				}
			};
			stream.on('dataset', handler);
		});
	};
};
