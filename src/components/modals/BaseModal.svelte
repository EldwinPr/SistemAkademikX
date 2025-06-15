<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let show = false;
	export let title = '';
	export let maxWidth = 'max-w-4xl'; // Default to large, but can be overridden
	export let closable = true;
	export let closeOnBackdrop = true;
	export let closeOnEscape = true;
	
	const dispatch = createEventDispatcher();
	
	function handleClose() {
		if (closable) {
			dispatch('close');
		}
	}
	
	function handleBackdropClick(e: MouseEvent) {
		if (closeOnBackdrop && e.target === e.currentTarget) {
			handleClose();
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (closeOnEscape && e.key === 'Escape') {
			handleClose();
		}
	}
</script>

{#if show}
	<!-- Backdrop with blur effect -->
	<div 
		class="fixed inset-0 z-50 overflow-y-auto"
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
	>
		<div class="flex min-h-screen items-center justify-center p-4">
			<!-- Blur backdrop -->
			<div 
				class="fixed inset-0 backdrop-blur-sm bg-white/10 transition-opacity"
				on:click={handleBackdropClick}
				aria-hidden="true"
			></div>
			
			<!-- Modal panel with auto-sizing -->
			<div class="relative bg-white rounded-lg shadow-xl w-full {maxWidth} max-h-[95vh] flex flex-col">
				
				<!-- Header (if title provided) -->
				{#if title || closable}
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg flex-shrink-0">
						<div class="flex items-center justify-between">
							{#if title}
								<h3 id="modal-title" class="text-xl font-semibold text-gray-900">
									{title}
								</h3>
							{:else}
								<div></div>
							{/if}
							
							{#if closable}
								<button 
									type="button" 
									class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
									on:click={handleClose}
									aria-label="Close modal"
								>
									<span class="text-2xl" aria-hidden="true">&times;</span>
								</button>
							{/if}
						</div>
					</div>
				{/if}
				
				<!-- Content area with scroll -->
				<div class="flex-1 overflow-y-auto">
					<slot />
				</div>
				
				<!-- Footer (if provided) -->
				{#if $$slots.footer}
					<div class="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg flex-shrink-0">
						<slot name="footer" />
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Ensure modal content respects max height */
	:global(.modal-content) {
		max-height: calc(95vh - 8rem); /* Account for header/footer */
	}
</style>