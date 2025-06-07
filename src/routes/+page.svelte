<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	export let data: any; // Simple any type

	onMount(() => {
		if (data?.user) {
			goto('/dashboard', { replaceState: true });
		} else {
			goto('/auth/login', { replaceState: true });
		}
	});
</script>

<svelte:head>
	<title>Sistem Transkrip Akademik</title>
</svelte:head>

<!-- Loading state while redirecting -->
<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="text-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
		<p class="mt-4 text-gray-600">Memuat...</p>
	</div>
</div>