import EventHub from '../src/EventHub.js';

let hub;

describe('Given a new instance of eventHub', () => {
	let warnStub;
	let mockPostMessage;
	let mockTargetPostMessage;

	beforeAll(() => {
		hub = new EventHub({
			targetOrigin: 'http://localhost:8000',
			originRegex: /http:\/\/.*/i,
			targetWindow: window.parent,
		});
	});
	beforeEach(() => {
		warnStub = jest.fn();
		console.warn = warnStub;

		mockPostMessage = jest.fn();
		window.postMessage = mockPostMessage;

		mockTargetPostMessage = jest.fn();
		window.parent.postMessage = mockTargetPostMessage;
	});
	afterEach(() => {
		warnStub.mockRestore();
		mockTargetPostMessage.mockRestore();
	});

	it('can initialize with a hubId', () => {
		let hub2 = new EventHub({
			hubId: -1,
			targetOrigin: 'http://localhost:8000',
			originRegex: /http:\/\/.*/i,
			targetWindow: window.parent,
		});
		hub2.emit('foo', {bar: 'baz2'});
		expect(warnStub.mock.calls.length).toBe(0);
	});
	it('dynamically sets a targetOrigin', (done) => {
		let _hub = new EventHub({/* no targetOrigin option */ });
		_hub.publish('_init_', {hubId: 0, targetOrigin: 'target-origin'});
		_hub.nextTick(() => {
			expect(_hub.about().targetOrigin).toBe('target-origin');
			done();
		});
	});
	it('assigns a hubId on _init_', (done) => {
		hub.emit('foo', {bar: 'baz'});
		expect(warnStub.mock.calls[0][0]).toBe('[EventHub] has no hubId.');
		warnStub.mockClear();

		hub.publish('_init_', 4);
		hub.nextTick(() => {
			hub.emit('foo', {bar: 'baz2'});
			expect(warnStub.mock.calls.length).toBe(0);
			mockTargetPostMessage.mockRestore();
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
	it('returns a token on subscribe', () => expect(hub.subscribe('foo')).toBe('1'));
	it('increments tokens', () => expect(hub.subscribe('foo')).toBe('2'));
	it('returns token on unsubscribe', () => expect(hub.unsubscribe('2')).toBe('2'));
	it('returns false if cannot unsubscribe', () => expect(hub.unsubscribe('3')).toBe(false));
	it('calls func on publish', (done) => {
		let mockFn = jest.fn();
		hub.subscribe('foo', mockFn);
		hub.publish('foo');
		hub.nextTick(() => {
			expect(mockFn.mock.calls[0]).toMatchObject(['foo', undefined]);
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
	it('emits a publish and a postMessage', (done) => {
		hub.subscribe('foo', (type, payload) => expect(type).toBe('foo'));
		hub.emit('foo', {bar: 'baz'});
		hub.nextTick(() => {
			expect(mockTargetPostMessage.mock.calls.length).toBe(1);
			done();
		});
	});
	it('listens for new messages', () => {
		let mock = jest.fn();
		window.addEventListener = mock;
		new EventHub({
			targetOrigin: 'blah',
			originRegex: /blah/i,
			targetWindow: window.parent,
		});
		expect(mock.mock.calls.length).toBe(1);
		mock.mockRestore();
	});
	it('checks for valid origins', () => {
		const _hub = new EventHub({
			targetOrigin: 'http://test.localhost',
			targetWindow: window.parent,
			originRegex: /^(https?):\/\/.*(\.?protolabs)(\.com)$/i,
		});
		expect(_hub.isOriginValid('http://bad.origin.biz')).toBe(false);
		expect(_hub.isOriginValid('http://protolabs.com')).toBe(true);
		expect(_hub.isOriginValid('https://protolabs.com')).toBe(true);
		expect(_hub.isOriginValid('http://protolabs.com/')).toBe(false);

		expect(_hub.isOriginValid('https://proxy.protolabs.com')).toBe(true);
	});
	it('posts to window arg and uses options.targetWindow as fallback', () => {
		let fakeWindow = {postMessage: mockPostMessage};

		hub.emit('blah', {payload: 'foo'});
		expect(mockTargetPostMessage.mock.calls.length).toBe(1);
		hub.emit('blah', {payload: 'foo'}, fakeWindow);
		expect(mockPostMessage.mock.calls.length).toBe(1);
	});
	it('does not send postMessage if targetOrigin not set', () => {
		let _hub = new EventHub();
		let fakeWindow = {postMessage: () => {/* do-nothing */}};
		_hub.emit('blah', {payload: 'foo'}, fakeWindow);
		expect(mockTargetPostMessage.mock.calls.length).toBe(0);
	});
	it('exposes a post function', () => {
		expect(hub.post).not.toBeNull;
	});
});

describe('Given a new hub, when debugging mode is on', () => {
	let mockConsole;
	let mockPostMessage;
	let mockTargetPostMessage;

	beforeAll(() => {
		hub = new EventHub({
			targetOrigin: 'http://localhost:8000',
			originRegex: /http:\/\/.*/i,
			targetWindow: window.parent,
			debugFn: (event, payload) => console.log(`[DEBUG] Event: '${event}', Payload: `, payload),
		});
	});
	beforeEach(() => {
		mockConsole = jest.fn();
		console.log = mockConsole;

		mockPostMessage = jest.fn();
		window.postMessage = mockPostMessage;

		mockTargetPostMessage = jest.fn();
		window.parent.postMessage = mockTargetPostMessage;
	});
	afterEach(() => {
		mockConsole.mockRestore();
		mockPostMessage.mockRestore();
		mockTargetPostMessage.mockRestore();
	});
	it('executes the debugFn on publish', (done) => {
		hub.subscribe('foo', () => {});
		hub.publish('foo', null);
		mockConsole.mockClear();
		hub.nextTick(() => {
			expect(mockConsole.mock.calls[0][0]).toBe(`[DEBUG] Event: 'foo', Payload: `);
			done();
		});
	});
	it('executes the debugFn for all subscribers', (done) => {
		hub.subscribe('bar', () => {});
		hub.subscribe('bar', () => {});
		mockConsole.mockClear();
		hub.publish('bar', null);
		hub.nextTick(() => {
			expect(mockConsole.mock.calls.length).toBe(2);
			done();
		});
	});
	it('logs all unsubscribe events', () => {
		let token = hub.subscribe('baz', () => {});
		mockConsole.mockClear();
		hub.unsubscribe(token);
		expect(mockConsole.mock.calls.length).toBe(1);
		expect(mockConsole.mock.calls[0][0]).toBe('[EventHub] Unsubscribed token 4.');
	});
});
