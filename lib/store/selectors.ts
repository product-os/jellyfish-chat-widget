/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import filter from 'lodash/filter';
import orderBy from 'lodash/orderBy';
import get from 'lodash/get';
import isEqualWith from 'lodash/isEqualWith';
import { core } from '@balena/jellyfish-types';

export const selectProduct = () => {
	return (state) => {
		return state.product;
	};
};

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
		return orderBy(
			filter(messages, ['data.target', threadId]),
			'data.timestamp',
			'asc',
		);
	};
};

export const selectNotifications = () => {
	return selectCardsByType('notification');
};

export const selectNotificationsByThread = (threadId: string) => {
	return (state) => {
		return selectNotifications()(state).filter((notification) => {
			return (
				get(notification, [
					'links',
					'is attached to',
					0,
					'links',
					'is attached to',
					0,
					'id',
				]) === threadId
			);
		});
	};
};

export const areEqualArrayOfContracts = (
	leftContracts: core.Contract[],
	rightContracts: core.Contract[],
) => {
	return (
		leftContracts.length === rightContracts.length &&
		isEqualWith(leftContracts, rightContracts, (left, right) => {
			return left.id === right.id;
		})
	);
};
