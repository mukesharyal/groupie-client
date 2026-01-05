<script>
	let { connectionState, socketOpen } = $props();

	// Derived state for the label text
	let statusLabel = $derived.by(() => {
		if (connectionState === 'connected') return "LIVE STREAMING";
		if (connectionState === 'failed') return "SESSION ENDED";
		if (socketOpen) return "LINK ESTABLISHED";
		return "DISCONNECTED";
	});
	
	let isLive = $derived(connectionState === 'connected');
</script>

<div class="status-container">
	<div class="status-pill" class:live={isLive}>
		<div class="dot"></div>
		<span>{statusLabel}</span>
	</div>
</div>

<style>
	/* ... Copy your existing .status-pill, .dot, and @keyframes pulse styles here ... */
	.live { color: #2ecc71; border-color: #2ecc71; background: rgba(46, 204, 113, 0.1); }
	.live .dot { background: #2ecc71; animation: pulse 2s infinite; }
</style>