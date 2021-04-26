/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import _ from 'lodash';
import update from 'immutability-helper';
import { SET_CARDS, SET_CURRENT_USER, SET_GROUPS } from './action-types';

const mergeCards = (state, cards) => {
	return cards.reduce((newCards, card) => {
		newCards[card.id] = _.merge({}, newCards[card.id], card);
		return newCards;
	}, state.cards);
};

const extractLinksFromCards = (threads) => {
	return threads.reduce((cards, thread) => {
		if (thread.links && thread.links['has attached element']) {
			return cards.concat(thread, thread.links['has attached element']);
		}
		return cards.concat(thread);
	}, []);
};

export const createReducer = ({ product, productTitle, inbox, query }) => {
	const initialState = {
		product,
		productTitle,
		inbox,
		cards: {},
		currentUser: null,
		query,
	};

	return (state = initialState, action: any = {}) => {
		switch (action.type) {
			case SET_CARDS: {
				const threads = extractLinksFromCards(action.payload);
				return update(state, {
					cards: {
						$set: mergeCards(state, threads),
					},
				});
			}
			case SET_CURRENT_USER:
				return update(state, {
					currentUser: {
						$set: action.payload.id,
					},
					cards: {
						$set: mergeCards(state, [action.payload]),
					},
				});
			case SET_GROUPS:
				return update<any>(state, {
					groups: {
						$set: action.payload,
					},
				});

			default:
				return state;
		}
	};
};
