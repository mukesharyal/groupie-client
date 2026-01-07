<script>
	import { onMount } from 'svelte';
	import Stream from './components/Stream.svelte';

	// Reactive State
	let remoteStream = $state(null);
	let connectionState = $state('new');
	let isPlaying = $state(true); 

	let pc = new RTCPeerConnection({
		iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
	});
	let dataChannel = $state(null);
	let socket = null;

	/**
	 * Unified function to send messages over DataChannel
	 * Matches the logic used in Stream.svelte
	 */
	const sendAction = (type, value) => {
		if (!dataChannel || dataChannel.readyState !== 'open') return;

		dataChannel.send(JSON.stringify({
			type,
			value
		}));
	};

	onMount(async () => {
		connectionState = 'connecting';
		try {
			const webSocketAddress = 'WS_URL_PLACEHOLDER';

			socket = new WebSocket(webSocketAddress);
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
			connectionState = 'failed';
			console.error("Could not initialize connection:", err);
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
		
		// Synchronize state immediately upon opening
		dataChannel.onopen = () => {
			sendAction('liveChange', isPlaying);
		};
	};

	function toggleState() {
		isPlaying = !isPlaying;
		sendAction('liveChange', isPlaying);
	}
</script>

<main>
	{#if connectionState !== 'connected'}
		<div class="loader">
			<div class="spinner"></div>
			<p>Connecting...</p>
		</div>
	{:else}
		<div class="phone-container">
			<Stream stream={remoteStream} {dataChannel} />

			<button 
				class="ios-fab" 
				onclick={toggleState} 
				aria-label={isPlaying ? 'Stop' : 'Play'}
			>
				{#if isPlaying}
					<svg viewBox="0 0 24 24" width="20" height="20">
						<rect x="6" y="6" width="12" height="12" fill="currentColor" rx="1.5" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" width="20" height="20">
						<path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
					</svg>
				{/if}
			</button>
		</div>
	{/if}
</main>

<style>
	:global(body) {
		background-color: #0f0f0f;
		margin: 0;
		color: white;
		font-family: -apple-system, system-ui, sans-serif;
	}

	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		width: 100vw;
	}

	.loader { 
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center; 
		width: 100%;
	}

	.spinner {
		width: 28px; height: 28px;
		border: 2px solid #222;
		border-top-color: #007AFF;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: 15px;
	}
	
	@keyframes spin { to { transform: rotate(360deg); } }

	.phone-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ios-fab {
		position: absolute;
		right: 12px; 
		top: 50%;
		transform: translateY(-50%);
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: none;
		background-color: #007AFF;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 100;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		transition: transform 0.1s ease, background-color 0.2s;
		outline: none;
		-webkit-tap-highlight-color: transparent;
	}

	.ios-fab:active {
		transform: translateY(-50%) scale(0.92);
		background-color: #0063d1;
	}

	svg {
		display: block;
	}
</style>
