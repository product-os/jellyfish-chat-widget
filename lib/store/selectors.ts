/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import chain from 'lodash/chain';
import filter from 'lodash/filter';
import orderBy from 'lodash/orderBy';

export const selectCardsByType = (type) => {
	return (state) => {
		return filter(state.cards, (card) => {
			return card.type.split('@')[0] === type;
		});
	};
};

export const selectCardById = (id) => {
	return (state) => {
		return state.cards[id] || null;
	};
};

export const selectGroups = () => {
	return (state) => {
		return {
			groups: state.groups || [],
		};
	};
};

export const selectThreads = () => {
	return (state) => {
		const threads = selectCardsByType('support-thread')(state);
		return orderBy(
			threads,
			(thread) => {
				const messages = selectMessages(thread.id)(state);
				return messages.length ? messages[0].data.timestamp : thread.created_at;
			},
			'desc',
		);
	};
};

export const selectCurrentUser = () => {
	return (state) => {
		return selectCardById(state.currentUser)(state);
	};
};

export const selectMessages = (threadId) => {
	return (state) => {
		const messages = selectCardsByType('message')(state);
		return chain(messages)
			.filter(['data.target', threadId])
			.sortBy('data.timestamp')
			.value();
	};
};
