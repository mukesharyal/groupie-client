<script>
    let { stream, dataChannel } = $props(); 
    let videoElement;
    
    // Keep track of which pointers are actually pressed down
    let activePointers = new Set();

    function throttle(func, limit) {
        let lastRan;
        let lastFunc;
        return function(...args) {
            if (!lastRan) {
                func.apply(this, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(this, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    const sendGesture = (type, e) => {
        // Validation: 
        // 1. Connection check
        if (!dataChannel || dataChannel.readyState !== 'open' || !videoElement) return;
        
        // 2. State check: Only send "move" if the pointer is currently down
        if (type === "move" && !activePointers.has(e.pointerId)) return;

        const rect = videoElement.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const normX = Math.max(0, Math.min(1, x));
        const normY = Math.max(0, Math.min(1, y));

        dataChannel.send(JSON.stringify({
            type,
            x: normX,
            y: normY,
            id: e.pointerId
        }));
    };

    const throttledMove = throttle((e) => sendGesture("move", e), 16);

    $effect(() => {
        if (videoElement && stream) {
            videoElement.srcObject = stream;
        }
    });
</script>

<div class="phone-mockup">
    <video 
        bind:this={videoElement} 
        autoplay 
        playsinline 
        muted 
        id="remoteVideo"
        onpointerdown={(e) => {
            activePointers.add(e.pointerId); // Mark pointer as active
            videoElement.setPointerCapture(e.pointerId);
            sendGesture("down", e);
        }}
        onpointermove={throttledMove}
        onpointerup={(e) => {
            sendGesture("up", e);
            videoElement.releasePointerCapture(e.pointerId);
            activePointers.delete(e.pointerId); // Remove from active
        }}
        onpointercancel={(e) => {
            sendGesture("up", e);
            videoElement.releasePointerCapture(e.pointerId);
            activePointers.delete(e.pointerId); // Remove from active
        }}
    ></video>
</div>

<style>
    .phone-mockup { 
        position: relative; 
        width: 90vw; 
        max-width: 360px; 
        aspect-ratio: 9 / 19.5; 
        background-color: #000; 
        border-radius: 55px; 
        border: 10px solid #2a2a2a; 
        outline: 4px solid #1a1a1a; 
        box-shadow: 0 40px 100px rgba(0,0,0,0.9), inset 0 0 20px rgba(255,255,255,0.05); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        overflow: hidden;
        touch-action: none;
        user-select: none;
    }

    video { 
        width: 100%; 
        height: 100%; 
        object-fit: cover; 
        cursor: crosshair;
        touch-action: none;
    }
</style>
