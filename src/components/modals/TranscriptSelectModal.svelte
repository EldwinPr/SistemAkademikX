<script lang="ts">
	import BaseModal from './BaseModal.svelte';
	import LoadingButton from '../shared/LoadingButton.svelte';
	
	export let show = false;
	export let availableTranscripts: any[] = [];
	export let loading = false;
	
	function handleClose() {
		show = false;
	}
	
	function selectTranscript(recordId: string) {
		// Create and submit form to view the selected transcript
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/viewMyTranscript';
		
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = 'recordId';
		input.value = recordId;
		
		form.appendChild(input);
		document.body.appendChild(form);
		form.submit();
		document.body.removeChild(form);
	}
</script>

<BaseModal 
	bind:show 
	title="Pilih Transkrip"
	maxWidth="max-w-md"
	on:close={handleClose}
>
	<div class="p-6">
		{#if loading}
			<div class="flex items-center justify-center py-8">
				<div class="text-center">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
					<p class="text-sm text-gray-600">Memuat daftar transkrip...</p>
				</div>
			</div>
		{:else if availableTranscripts.length > 0}
			<p class="text-sm text-gray-600 mb-4">
				Anda memiliki {availableTranscripts.length} transkrip. Pilih yang ingin dilihat:
			</p>
			
			<div class="space-y-3">
				{#each availableTranscripts as transcript, index}
					<button 
						type="button"
						class="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
						on:click={() => selectTranscript(transcript.id)}
					>
						<div class="flex justify-between items-center">
							<div>
								<p class="font-medium text-gray-900">
									Transkrip {index + 1}
								</p>
								<p class="text-sm text-gray-500">
									Dibuat: {new Date(transcript.createdAt).toLocaleDateString('id-ID')}
								</p>
								<p class="text-xs text-gray-400">
									ID: {transcript.id.substring(0, 8)}...
								</p>
							</div>
							<div class="text-right">
								{#if transcript.digitalSignature}
									<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
										✅ Ditandatangani
									</span>
								{:else}
									<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
										⏳ Menunggu TTD
									</span>
								{/if}
							</div>
						</div>
					</button>
				{/each}
			</div>

			<!-- Info Box -->
			<div class="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
				<p class="text-xs text-blue-600">
					💡 <strong>Tips:</strong> Transkrip yang sudah ditandatangani dapat dicetak sebagai PDF resmi. 
					Transkrip yang masih menunggu sedang diproses oleh Kepala Program Studi.
				</p>
			</div>
		{:else}
			<div class="text-center py-8">
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
					<svg class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<p class="text-sm text-gray-500 font-medium">Belum Ada Transkrip</p>
				<p class="text-xs text-gray-400 mt-1">Hubungi dosen wali Anda untuk input data akademik.</p>
			</div>
		{/if}
	</div>
</BaseModal>