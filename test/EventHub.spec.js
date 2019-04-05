import fs from 'fs';
import path from 'path';
import EventHub from '../src/EventHub.js';

describe('Given a new instance of eventHub', () => {
	let hub;
	beforeEach(() => {
		hub = new EventHub({
			targetOrigin: 'http://localhost:8000',
			originRegex: /http:\/\/.*/i,
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
		let fakeWindow = {postMessage: () => {/* do-nothing */}};
		window.parent.postMessage = jest.fn();
		hub.emit('blah', {payload: 'foo'}, fakeWindow);
		expect(window.parent.postMessage.mock.calls.length).toBe(0);
		console.warn.mockRestore();
	});

	it('returns the correct version number about()', () => {
		const pckg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json')));
		let about = hub.about();
		expect(about.version).toBe(pckg.version);
	});

	it('exposes a post function', () => expect(hub.post).toBeDefined());
});
