<script lang="ts">
	import BaseModal from './BaseModal.svelte';
	import TranscriptViewer from '../shared/TranscriptViewer.svelte';
	import LoadingButton from '../shared/LoadingButton.svelte';
	import { VerificationStatus } from '$lib/types/academic.types';
	import type { AcademicRecord } from '$lib/types/academic.types';
	
	export let show = false;
	export let transcript: (AcademicRecord & {
		verificationStatus?: string;
		verificationMessage?: string;
		signedBy?: string;
		recordCreatedAt?: Date;
	}) | null = null;
	export let allowBack = false;
	export let loading = false;
	
	function handleClose() {
		show = false;
		transcript = null;
	}
	
	function handleBack() {
		if (allowBack) {
			// Emit back event to parent
			handleClose();
		}
	}
</script>

<BaseModal 
	bind:show 
	title="Detail Transkrip Akademik"
	maxWidth="max-w-7xl"
	on:close={handleClose}
>
	<div class="p-6">
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
					<p class="text-gray-600">Memuat data transkrip...</p>
				</div>
			</div>
		{:else if transcript}
			<TranscriptViewer 
				{transcript} 
				showTitle={false}
				allowClose={false}
			/>
		{:else}
			<div class="text-center py-12">
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
					<svg class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<p class="text-sm text-gray-500 font-medium">Tidak Ada Data</p>
				<p class="text-xs text-gray-400 mt-1">Transkrip tidak ditemukan atau gagal dimuat.</p>
			</div>
		{/if}
	</div>
	
	<svelte:fragment slot="footer">
		<div class="flex gap-3 justify-end">
			{#if allowBack}
				<LoadingButton 
					variant="secondary"
					on:click={handleBack}
				>
					← Kembali ke Daftar
				</LoadingButton>
			{/if}
			<LoadingButton 
				variant="secondary"
				on:click={handleClose}
			>
				Tutup
			</LoadingButton>
		</div>
	</svelte:fragment>
</BaseModal>