<script>
	import { onMount } from 'svelte';
	import Stream from './components/Stream.svelte';
	import StatusPill from './components/Status.svelte';

	// Reactive State
	let remoteStream = $state(null);
	let connectionState = $state('new');
	let socketOpen = $state(false);
	let messages = $state([]);

	let pc = new RTCPeerConnection({
		iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
	});
	let dataChannel = $state(null);
	let socket = null;

	onMount(async () => {
		try {
			// 1. Dynamically import the address from your Ktor endpoint
			// The @vite-ignore comment prevents build-time errors
			//const module = await import(/* @vite-ignore */ './address.js');
			
			// For now, commenting the dynamic address
			//const webSocketAddress = module.webSocketAddress;
			
			const webSocketAddress = 'ws://192.168.1.13:8080/signal';

			// 2. Initialize WebSocket inside onMount
			socket = new WebSocket(webSocketAddress);

			socket.onopen = () => {
				socketOpen = true;
			};

			socket.onmessage = async (event) => {
				const data = JSON.parse(event.data);
				if (data.type === 'offer') {
					await pc.setRemoteDescription(new RTCSessionDescription(data));
					const answer = await pc.createAnswer();
					await pc.setLocalDescription(answer);
					socket.send(JSON.stringify({ type: 'answer', sdp: answer.sdp }));
				} else if (data.type === 'candidate') {
					try {
						await pc.addIceCandidate(new RTCIceCandidate(data));
					} catch (e) {
						console.error("ICE error", e);
					}
				}
			};
		} catch (err) {
			console.error("Could not load dynamic address.js:", err);
		}
	});

	pc.ontrack = (event) => {
		if (event.streams && event.streams[0]) {
			remoteStream = event.streams[0];
		}
	};

	pc.onconnectionstatechange = () => {
		connectionState = pc.connectionState;
	};

	pc.ondatachannel = (event) => {
		dataChannel = event.channel;
		dataChannel.onmessage = (e) => {
			messages = [...messages, e.data];
		};
	};

	function sendMessage(msg) {
		if (dataChannel?.readyState === 'open') {
			dataChannel.send(msg);
		}
	}
</script>

<main>
	<Stream stream={remoteStream} dataChannel={dataChannel} />
	<StatusPill {connectionState} {socketOpen} />
</main>

<style>
	:global(body) {
		background-color: #0f0f0f;
		color: white;
		margin: 0;
	}
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
	}
</style>
