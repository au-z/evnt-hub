const hub = new EventHub({originRegex: /.*/});

const template = `<div class="demo">
<div class="input-label" data-label="type">
	<input type="text" v-model="subscribeForm.type" placeholder="event.type">
</div>
<button @click="subscribe">Subscribe</button>
<br>

<div class="subscriptions">
	<div class="subscription" v-for="s in subscriptions">
		<span>{{s.type}}</span>
		<div @click="unsubscribe(s.token)">
			<i class="fa fa-times"></i>
		</div>
	</div>
</div>

<div class="input-label" data-label="type">
	<input type="text" v-model="publishForm.type" placeholder="event.type">
</div>
<div class="input-label" data-label="payload">
	<input class="payload" type="text" v-model="publishForm.payload" placeholder='{"foo": "bar"}'>
</div>
<button @click="publish">Publish</button>
<br>

<div class="events">
	<div v-for="e in events">
		<em>{{e.date}}</em> <span>{{e.type}}</span> <span>{{JSON.stringify(e.payload, null, 2)}}</span><br>
	</div>
</div>
</div>`;

const vue = new Vue({
	el: '#demo',
	render: (h) => h({
		template,
		data: () => ({
			subscribeForm: {
				type: null,
			},
			publishForm: {
				type: null,
				payload: null,
			},
			subscriptions: [],
			events: [],
		}),
		methods: {
			subscribe() {
				if (!this.subscribeForm.type) return;
				const token = hub.subscribe(this.subscribeForm.type, (type, payload) => this.events.splice(0, 0, {
					date: moment().format(),
					type,
					payload,
				}));
				this.subscriptions.push({
					type: this.subscribeForm.type,
					token,
				});
				this.subscribeForm.type = null;
			},
			publish() {
				if (!this.publishForm.type || !this.publishForm.payload) return;
				const isObj = /^{.*}$/.exec(this.publishForm.payload);
				const payload = isObj ? JSON.parse(this.publishForm.payload) : this.publishForm.payload;
				hub.publish(this.publishForm.type, payload);
			},
			unsubscribe(token) {
				const success = hub.unsubscribe(token);
				if (success) {
					this.subscriptions.splice(this.subscriptions.findIndex((s) => s.token === token), 1);
				}
			},
		},
	}),
});
