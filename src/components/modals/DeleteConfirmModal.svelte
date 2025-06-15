<script lang="ts">
	import BaseModal from './BaseModal.svelte';
	import LoadingButton from '../shared/LoadingButton.svelte';
	
	export let show = false;
	export let title = 'Konfirmasi Hapus';
	export let message = 'Apakah Anda yakin ingin menghapus item ini?';
	export let itemName = '';
	export let warningItems: string[] = [];
	export let actionUrl = '';
	export let actionMethod: 'POST' | 'GET' | 'post' | 'get' | 'dialog' | 'DIALOG' = 'POST';
	export let hiddenFields: Record<string, string> = {};
	export let loading = false;
	export let confirmText = 'Ya, Hapus';
	export let cancelText = 'Batal';
	export let variant: 'danger' | 'warning' = 'danger';
	
	let formElement: HTMLFormElement;
	
	function handleClose() {
		show = false;
	}
	
	function handleConfirm() {
		if (formElement && actionUrl) {
			loading = true;
			formElement.submit();
		}
	}
</script>

<BaseModal 
	bind:show 
	{title}
	maxWidth="max-w-md"
	on:close={handleClose}
>
	<div class="p-6">
		<!-- Warning Icon -->
		<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-{variant === 'danger' ? 'red' : 'yellow'}-100 mb-4">
			<svg class="h-6 w-6 text-{variant === 'danger' ? 'red' : 'yellow'}-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
			</svg>
		</div>
		
		<!-- Main Message -->
		<div class="text-center">
			<h3 class="text-lg font-medium text-gray-900 mb-2">{title}</h3>
			<p class="text-sm text-gray-600 mb-4">
				{message}
				{#if itemName}
					<strong>{itemName}</strong>?
				{/if}
			</p>
		</div>
		
		<!-- Warning List -->
		{#if warningItems.length > 0}
			<div class="bg-{variant === 'danger' ? 'red' : 'yellow'}-50 border border-{variant === 'danger' ? 'red' : 'yellow'}-200 rounded-md p-3 mb-4">
				<p class="text-sm text-{variant === 'danger' ? 'red' : 'yellow'}-800 font-medium mb-2">
					⚠️ <strong>Peringatan:</strong> Tindakan ini akan menghapus:
				</p>
				<ul class="text-sm text-{variant === 'danger' ? 'red' : 'yellow'}-700 list-disc list-inside space-y-1">
					{#each warningItems as item}
						<li>{item}</li>
					{/each}
				</ul>
				<p class="text-sm text-{variant === 'danger' ? 'red' : 'yellow'}-800 mt-2 font-medium">
					Data yang sudah dihapus tidak dapat dikembalikan!
				</p>
			</div>
		{/if}
		
		<!-- Hidden Form for Submission -->
		{#if actionUrl}
			<form 
				bind:this={formElement}
				method={actionMethod} 
				action={actionUrl}
				class="hidden"
			>
				{#each Object.entries(hiddenFields) as [key, value]}
					<input type="hidden" name={key} {value} />
				{/each}
			</form>
		{/if}
	</div>
	
	<svelte:fragment slot="footer">
		<div class="flex gap-3 justify-end">
			<LoadingButton 
				variant="secondary"
				on:click={handleClose}
				disabled={loading}
			>
				{cancelText}
			</LoadingButton>
			<LoadingButton 
				variant={variant === 'warning' ? 'primary' : variant}
				{loading}
				loadingText="Menghapus..."
				on:click={handleConfirm}
			>
				{confirmText}
			</LoadingButton>
		</div>
	</svelte:fragment>
</BaseModal>