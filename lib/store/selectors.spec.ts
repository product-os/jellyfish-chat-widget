/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */
import { v4 as uuidv4 } from 'uuid';
import { createReducer } from './reducer';
import { selectMessages } from './selectors';

const context: any = {};

beforeEach(() => {
	context.reducer = createReducer({
		product: 'jelly-chat-test',
		productTitle: 'Jelly Chat Test',
		inbox: 'paid',
		query: null,
	});
});

test('selectMessages should sort messages by data.timestamp asc', () => {
	const timestamp = Date.now();
	const target = uuidv4();

	const card1 = {
		id: uuidv4(),
		type: 'message@1.0.0',
		data: {
			timestamp: timestamp + 1,
			target,
		},
	};

	const card2 = {
		id: uuidv4(),
		type: 'message@1.0.0',
		data: {
			timestamp,
			target,
		},
	};

	const card3 = {
		id: uuidv4(),
		type: 'message@1.0.0',
		data: {
			timestamp: timestamp + 2,
			target,
		},
	};

	const state = context.reducer({
		cards: {
			[card1.id]: card1,
			[card2.id]: card2,
			[card3.id]: card3,
		},
	});

	const messages = selectMessages(target)(state);

	expect(messages).toEqual([card2, card1, card3]);
});
