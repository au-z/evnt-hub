import fs from 'fs';
import path from 'path';

import chai from 'chai';
import sinon from 'sinon';
import jsdomGlobal from 'jsdom-global';
import EventHub from '../src/EventHub.js';

jsdomGlobal();
chai.expect();
const expect = chai.expect;

let hub;

describe('Given a new instance of eventHub', () => {
	before(() => {
		hub = new EventHub({
			targetOrigin: 'http://localhost:8000',
			originRegex: /http:\/\/.*/i,
			targetWindow: window.parent,
		});
	});
	it('can initialize with a hubId', () => {
		let hub2 = new EventHub({
			hubId: -1,
			targetOrigin: 'http://localhost:8000',
			originRegex: /http:\/\/.*/i,
			targetWindow: window.parent,
		});
		let warnSpy = sinon.spy(console, 'warn');
		hub2.emit('foo', {bar: 'baz2'});
		expect(warnSpy.notCalled).to.be.true;
		warnSpy.restore();
	});
	it('dynamically sets a targetOrigin', (done) => {
		let warnStub = sinon.stub(console, 'warn');
		let _hub = new EventHub({/* no targetOrigin option */ });
		_hub.publish('_init_', {hubId: 0, targetOrigin: 'target-origin'});
		_hub.nextTick(() => {
			expect(_hub.about().targetOrigin).to.be.equal('target-origin');
			warnStub.restore();
			done();
		});
	});
	it('assigns a hubId on _init_', (done) => {
		let postMessageStub = sinon.stub(window.parent, 'postMessage');
		let warnStub = sinon.stub(console, 'warn');
		hub.emit('foo', {bar: 'baz'});
		expect(warnStub.getCall(0).args[0]).to.be.equal('[EventHub] has no hubId.');
		warnStub.reset();
		hub.publish('_init_', 4);
		hub.nextTick(() => {
			hub.emit('foo', {bar: 'baz2'});
			expect(warnStub.notCalled).to.be.true;
			warnStub.restore();
			postMessageStub.restore();
			done();
		});
	});
	it('assigns a hubId on _init_ where payload is an object', (done) => {
		hub.publish('_init_', {hubId: 42});
		hub.nextTick(() => {
			expect(hub.about().hubId).to.be.equal('42');
			done();
		});
	});
	it('returns a token on subscribe', () => expect(hub.subscribe('foo')).to.be.equal('1'));
	it('increments tokens', () => expect(hub.subscribe('foo')).to.be.equal('2'));
	it('returns token on unsubscribe', () => expect(hub.unsubscribe('2')).to.be.equal('2'));
	it('returns false if cannot unsubscribe', () => expect(hub.unsubscribe('3')).to.be.false);
	it('calls func on publish', (done) => {
		let cb = sinon.spy();
		hub.subscribe('foo', cb);
		hub.publish('foo');
		hub.nextTick(() => {
			expect(cb.calledOnce).to.be.true;
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
			expect(calledOnce).to.be.true;
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
				expect(called).to.be.false;
				done();
			});
		});
	});
	it('emits a publish and a postMessage', (done) => {
		hub.subscribe('foo', (type, payload) => expect(type).to.be.equal('foo'));
		let stub = sinon.stub(window.parent, 'postMessage');
		hub.emit('foo', {bar: 'baz'});
		hub.nextTick(() => {
			expect(stub.calledOnce).to.be.true;
			stub.restore();
			done();
		});
	});
	it('listens for new messages', () => {
		let stub = sinon.stub(window, 'addEventListener');
		new EventHub({
			targetOrigin: 'blah',
			originRegex: /blah/i,
			targetWindow: window.parent,
		});
		expect(stub.calledOnce).to.be.true;
		stub.restore();
	});
	it('checks for valid origins', () => {
		const _hub = new EventHub({
			targetOrigin: 'http://test.localhost',
			targetWindow: window.parent,
			originRegex: /^(https?):\/\/.*(\.?protolabs)(\.com)$/i,
		});
		expect(_hub.isOriginValid('http://bad.origin.biz')).to.be.false;
		expect(_hub.isOriginValid('http://protolabs.com')).to.be.true;
		expect(_hub.isOriginValid('https://protolabs.com')).to.be.true;
		expect(_hub.isOriginValid('http://protolabs.com/')).to.be.false;

		expect(_hub.isOriginValid('https://proxy.protolabs.com')).to.be.true;
	});
	it('posts to window arg and uses options.targetWindow as fallback', () => {
		let fakeWindow = {postMessage: () => {/* do-nothing */}};
		let postMessageSpy = sinon.spy(fakeWindow, 'postMessage');
		let targetWindowPostMessageSpy = sinon.spy(window.parent, 'postMessage');
		hub.emit('blah', {payload: 'foo'});
		expect(targetWindowPostMessageSpy.calledOnce).to.be.true;
		hub.emit('blah', {payload: 'foo'}, fakeWindow);
		expect(postMessageSpy.calledOnce).to.be.true;
		targetWindowPostMessageSpy.restore();
	});
	it('does not send postMessage if targetOrigin not set', () => {
		let warnStub = sinon.stub(console, 'warn');
		let _hub = new EventHub();
		let fakeWindow = {postMessage: () => {/* do-nothing */}};
		let targetWindowPostMessageSpy = sinon.spy(window.parent, 'postMessage');
		_hub.emit('blah', {payload: 'foo'}, fakeWindow);
		expect(targetWindowPostMessageSpy.notCalled).to.be.true;
		warnStub.restore();
	});
	it('returns the correct version number about()', () => {
		const pckg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json')));
		let about = hub.about();
		expect(about.version).to.be.equal(pckg.version);
	});
	it('exposes a post function', () => expect(hub.post).to.not.be.null);
});
