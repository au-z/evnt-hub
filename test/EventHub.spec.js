import EventHub from '../src/EventHub.ts';

describe('Given a new instance of eventHub', () => {
	let hub;
	beforeEach(() => {
		hub = new EventHub({
			targetOrigin: window.location.origin,
			originRegex: /.*/i,
			targetWindow: window.parent,
		});
	});

	it('can initialize with a hubId', () => {
		const hub = new EventHub({
			hubId: -1,
			targetOrigin: 'http://localhost:8000',
			originRegex: /http:\/\/.*/i,
			targetWindow: window.parent,
		});
		hub.emit('foo', {bar: 'baz2'});
		expect(hub.about().hubId).toBe(-1);
	});

	it('programmatically sets a targetOrigin', (done) => {
		console.warn = jest.fn();
		const hub = new EventHub({/* no targetOrigin option */ });
		hub.publish('_init_', {hubId: 0, targetOrigin: 'target-origin'});
		hub.nextTick(() => {
			expect(hub.about().targetOrigin).toBe('target-origin');
			expect(console.warn.mock.calls.length).toBe(1);
			done();
		});
	});

	it('assigns a hubId on _init_ where payload is an object', (done) => {
		hub.publish('_init_', {hubId: 42});
		hub.nextTick(() => {
			expect(hub.about().hubId).toBe('42');
			done();
		});
	});

	it('returns and increments a token on subscribe', () => {
		expect(hub.subscribe('foo')).toBe('1');
		expect(hub.subscribe('foo')).toBe('2');
	});

	it('returns token on unsubscribe', () =>
		expect(hub.unsubscribe(hub.subscribe('foo'))).toBe('1'));

	it('returns false if cannot unsubscribe', () =>
		expect(hub.unsubscribe('3')).toBe(false));

	it('calls func on publish', (done) => {
		let cb = jest.fn();
		hub.subscribe('foo', cb);
		hub.publish('foo');
		hub.nextTick(() => {
			expect(cb.mock.calls.length).toBe(1);
			done();
		});
	});

	it('passes data to subscription callback', (done) => {
		const data = {bar: 'baz'};
		let calledOnce = false;
		let func = (type, payload) => {
			calledOnce = true;
			return payload;
		};
		hub.subscribe('foo', func);
		hub.nextTick(() => {
			expect(calledOnce).toBe(true);
			done();
		});
		hub.publish('foo', data);
	});

	it('does not call func if unsubscribed', (done) => {
		let called = false;
		let func = (type, payload) => {
			called = true;
			return payload;
		};
		let token = hub.subscribe('foo', func);
		hub.publish('foo', {bar: 'baz'});
		hub.nextTick(() => {
			called = !called;
			hub.unsubscribe(token);
			hub.publish('foo', {bar: 'baz2'});
			hub.nextTick(() => {
				expect(called).toBe(false);
				done();
			});
		});
	});

	describe('when posting or emitting window.postMessages', () => {
		it('splits postMessage data into type, payload, and correlationId', (done) => {
			expect(hub.about().targetOrigin).toBe(window.location.origin);
			hub.subscribe('postMessage', (type, payload, meta) => {
				expect(type).toBe('postMessage');
				expect(payload).toMatchObject({foo: 'bar'});
				expect(meta).toMatchObject({correlationId: '424242', correlates: true});
				done();
			}, '424242');
			hub.post('postMessage', {foo: 'bar'}, window, '424242');
		});

		it('posts to window arg and uses options.targetWindow as fallback', () => {
			let fakeWindow = {postMessage: jest.fn()};
			window.parent.postMessage = jest.fn();
			hub.emit('blah', {payload: 'foo'});
			expect(window.parent.postMessage.mock.calls.length).toBe(1);
			hub.emit('blah', {payload: 'foo'}, fakeWindow);
			expect(fakeWindow.postMessage.mock.calls.length).toBe(1);
			window.parent.postMessage.mockRestore();
		});

		it('does not send postMessage if targetOrigin not set', () => {
			console.warn = jest.fn();
			const hub = new EventHub();
			let fakeWindow = {postMessage: () => {}};
			window.parent.postMessage = jest.fn();
			hub.emit('blah', {payload: 'foo'}, fakeWindow);
			expect(window.parent.postMessage.mock.calls.length).toBe(0);
			console.warn.mockRestore();
		});
	});

	describe('when using a correlationId', () => {
		it('can publish a payload with a correlationId', (done) => {
			hub.subscribe('test.message', (event, payload, meta) => {
				expect(meta.correlationId).toBe('test_id_please_ignore');
				expect(meta.correlates).toBe(false);
				done();
			});
			hub.publish('test.message', {foo: 'bar'}, 'test_id_please_ignore');
		});

		it('can test the correlationId matches within the hub publish', (done) => {
			hub.subscribe('foo', (event, payload, meta) => {
				expect(meta.correlationId).toBe('test_id_please_ignore');
				expect(meta.correlates).toBe(true);
				done();
			}, 'test_id_please_ignore');
			hub.publish('foo', {foo: 'bar'}, 'test_id_please_ignore');
		});

		it('can post a message with a correlationId to the targetWindow', () => {
			window.parent.postMessage = jest.fn();
			hub.emit('blah', {foo: 'bar'}, null, 'abc');
			expect(window.parent.postMessage.mock.calls[0][0]._meta.correlationId).toBe('abc');
			window.parent.postMessage.mockRestore();
		});
	});

	it('emits a publish and a postMessage', (done) => {
		hub.subscribe('foo', (type, payload) => expect(type).toBe('foo'));
		window.parent.postMessage = jest.fn();
		hub.emit('foo', {bar: 'baz'});
		hub.nextTick(() => {
			expect(window.parent.postMessage.mock.calls.length).toBe(1);
			window.parent.postMessage.mockRestore();
			done();
		});
	});

	describe('when using subscribeOnce', () => {
		it('throws if no correlation is provided or an empty string', () => {
			expect(() => hub.subscribeOnce('message', () => {}, '')).toThrow();
			expect(() => hub.subscribeOnce('message', () => {}, null)).toThrow();
			expect(() => hub.subscribeOnce('message', () => {}, undefined)).toThrow();
		});

		it('returns the subscription token', () => {
			expect(hub.subscribeOnce('message', () => {}, 'abc')).toBe('1');
		});

		it('invokes func only when the correlationId matches', (done) => {
			const handler = jest.fn();
			hub.subscribeOnce('message', handler, 'abc');
			hub.publish('message', {a: 'b'}, 'NO_CORRELATE');
			hub.nextTick(() => {
				expect(handler.mock.calls.length).toBe(0);
				hub.publish('message', {a: 'b'}, 'abc');
				hub.nextTick(() => {
					expect(handler.mock.calls[0][2]).toMatchObject({correlationId: 'abc', correlates: true});
					done();
				});
			});
		});

		it('stays subscribed if the correlationId does not match', (done) => {
			let token = hub.subscribeOnce('message', () => {}, 'abc');
			hub.publish('message', {foo: 'bar'}, 'NO_CORRELATE');
			hub.nextTick(() => {
				expect(hub.unsubscribe(token)).toBe('1');
				done();
			});
		});

		it('unsubscribes when the correlationId matches', (done) => {
			let token = hub.subscribeOnce('message', () => {}, 'abc');
			hub.publish('message', {foo: 'bar'}, 'abc');
			hub.nextTick(() => {
				expect(hub.unsubscribe(token)).toBe(false);
				done();
			});
		});
	});

	describe('when creating a hub request', () => {
		it('request resolves when the response message is received', (done) => {
			hub.request('request', 'response', {}).then((payload) => {
				expect(payload.value.foo).toBe('bar');
				expect(payload._meta).toMatchObject({correlates: false});
				done();
			});
			hub.publish('response', {foo: 'bar'});
		});

		it('requestOnce resolves only when the response is received and correlationId matches', (done) => {
			hub.requestOnce('request', 'response', null, window, 'abc').then((payload) => {
				expect(payload.value).toBe('correct');
				expect(payload._meta).toMatchObject({correlationId: 'abc', correlates: true});
				done();
			});
			hub.publish('response', 'incorrect', '123');
			hub.publish('response', 'correct', 'abc');
		});
	});

	it('listens for new messages', () => {
		window.addEventListener = jest.fn();
		new EventHub({
			targetOrigin: 'blah',
			originRegex: /blah/i,
			targetWindow: window.parent,
		});
		expect(window.addEventListener.mock.calls.length).toBe(1);
		window.addEventListener.mockRestore();
	});

	it('checks for valid origins', () => {
		const hub = new EventHub({
			targetOrigin: 'http://test.localhost',
			targetWindow: window.parent,
			originRegex: /^(https?):\/\/.*(\.?protolabs)(\.com)$/i,
		});
		expect(hub.isOriginValid('http://bad.origin.biz')).toBe(false);
		expect(hub.isOriginValid('http://protolabs.com')).toBe(true);
		expect(hub.isOriginValid('https://protolabs.com')).toBe(true);
		expect(hub.isOriginValid('http://protolabs.com/')).toBe(false);
		expect(hub.isOriginValid('https://proxy.protolabs.com')).toBe(true);
	});

	it('exposes a post function', () => expect(hub.post).toBeDefined());

	afterEach(() => jest.restoreAllMocks());
});
