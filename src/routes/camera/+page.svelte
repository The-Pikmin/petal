<script lang="ts">
    import { goto } from "$app/navigation";
    import WebCamera from "$lib/components/WebCamera.svelte";
    import type { CapturedPhoto } from "$lib/types";

    function handleCapture(photo: CapturedPhoto) {
        // Store photo and navigate to scan page
        sessionStorage.setItem("capturedPhoto", JSON.stringify(photo));
        goto("/scan");
    }

    function handleCancel() {
        // Return to home page
        goto("/");
    }
</script>

<svelte:head>
    <title>Camera - GreenEye</title>
</svelte:head>

<WebCamera onCapture={handleCapture} onCancel={handleCancel} />
