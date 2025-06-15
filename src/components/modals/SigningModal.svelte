<script lang="ts">
	import BaseModal from './BaseModal.svelte';
	import LoadingButton from '../shared/LoadingButton.svelte';
	
	export let show = false;
	export let records: any[] = [];
	export let loading = false;
	export let title = 'Tanda Tangan Digital Transkrip';
	
	// Loading states for individual actions
	let signingStates: Record<string, boolean> = {};
	let removingStates: Record<string, boolean> = {};
	
	function handleClose() {
		show = false;
		resetStates();
	}
	
	function resetStates() {
		signingStates = {};
		removingStates = {};
	}
	
	async function signRecord(recordId: string) {
		signingStates[recordId] = true;
		
		try {
			const formData = new FormData();
			formData.append('recordId', recordId);
			
			const response = await fetch('?/signRecord', {
				method: 'POST',
				body: formData
			});
			
			if (response.ok) {
				// Refresh page to show updated signature status
				window.location.reload();
			} else {
				alert('Gagal menandatangani transkrip');
			}
		} catch (error) {
			console.error('Error signing record:', error);
			alert('Terjadi kesalahan saat menandatangani transkrip');
		} finally {
			signingStates[recordId] = false;
		}
	}
	
	async function removeSignature(recordId: string) {
		if (!confirm('Apakah Anda yakin ingin menghapus tanda tangan digital dari transkrip ini?')) {
			return;
		}
		
		removingStates[recordId] = true;
		
		try {
			const formData = new FormData();
			formData.append('recordId', recordId);
			
			const response = await fetch('?/removeSignature', {
				method: 'POST',
				body: formData
			});
			
			if (response.ok) {
				// Refresh page to show updated signature status
				window.location.reload();
			} else {
				alert('Gagal menghapus tanda tangan');
			}
		} catch (error) {
			console.error('Error removing signature:', error);
			alert('Terjadi kesalahan saat menghapus tanda tangan');
		} finally {
			removingStates[recordId] = false;
		}
	}
	
	function getSignatureStatus(digitalSignature: string) {
		if (digitalSignature && digitalSignature.trim() !== '') {
			return {
				text: 'Sudah Ditandatangani',
				color: 'green',
				icon: '✅',
				signed: true
			};
		}
		return {
			text: 'Belum Ditandatangani',
			color: 'yellow',
			icon: '⏳',
			signed: false
		};
	}
	
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('id-ID');
	}
	
	// Check if any signing operations are in progress
	$: isAnySigning = Object.values(signingStates).some(Boolean) || Object.values(removingStates).some(Boolean);
</script>

<BaseModal 
	bind:show 
	{title}
	maxWidth="max-w-7xl"
	on:close={handleClose}
>
	<div class="p-6">
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
					<p class="text-gray-600">Memuat daftar transkrip...</p>
				</div>
			</div>
		{:else if records.length > 0}
			<!-- Header Info -->
			<div class="mb-6">
				<div class="bg-blue-50 border border-blue-200 rounded-md p-4">
					<div class="flex items-start">
						<svg class="h-5 w-5 text-blue-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
						</svg>
						<div class="text-sm text-blue-800">
							<p class="font-medium">Kelola Tanda Tangan Digital</p>
							<p class="mt-1">Tanda tangan digital memastikan keaslian dan integritas data akademik. Anda dapat menandatangani, menandatangani ulang, atau menghapus tanda tangan untuk setiap transkrip.</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Statistics -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg class="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<div class="ml-4">
							<div class="text-lg font-medium text-gray-900">{records.length}</div>
							<div class="text-sm text-gray-700">Total Transkrip</div>
						</div>
					</div>
				</div>
				
				<div class="bg-green-50 border border-green-200 rounded-lg p-4">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div class="ml-4">
							<div class="text-lg font-medium text-green-900">
								{records.filter(r => r.digitalSignature && r.digitalSignature.trim() !== '').length}
							</div>
							<div class="text-sm text-green-700">Sudah Ditandatangani</div>
						</div>
					</div>
				</div>
				
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg class="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div class="ml-4">
							<div class="text-lg font-medium text-yellow-900">
								{records.filter(r => !r.digitalSignature || r.digitalSignature.trim() === '').length}
							</div>
							<div class="text-sm text-yellow-700">Belum Ditandatangani</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Records Table -->
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Mahasiswa
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Tanggal Dibuat
							</th>
							<th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status TTD
							</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Aksi
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each records as record}
							{@const status = getSignatureStatus(record.digitalSignature)}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4 whitespace-nowrap">
									<div>
										<div class="text-sm font-medium text-gray-900">
											{record.student?.fullName || 'Unknown Student'}
										</div>
										<div class="text-sm text-gray-500">
											{record.student?.nim || 'No NIM'}
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">
										{formatDate(record.createdAt)}
									</div>
									<div class="text-sm text-gray-500">
										oleh {record.createdBy || 'System'}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-center">
									<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-{status.color}-100 text-{status.color}-800">
										{status.icon} {status.text}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right">
									<div class="flex gap-2 justify-end">
										{#if status.signed}
											<!-- Already signed - show Resign and Remove options -->
											<LoadingButton
												variant="primary"
												size="sm"
												loading={signingStates[record.id]}
												loadingText="Menandatangani..."
												disabled={isAnySigning}
												on:click={() => signRecord(record.id)}
											>
												Tanda Tangani Ulang
											</LoadingButton>
											<LoadingButton
												variant="danger"
												size="sm"
												loading={removingStates[record.id]}
												loadingText="Menghapus..."
												disabled={isAnySigning}
												on:click={() => removeSignature(record.id)}
											>
												Hapus TTD
											</LoadingButton>
										{:else}
											<!-- Not signed - show Sign option -->
											<LoadingButton
												variant="success"
												size="sm"
												loading={signingStates[record.id]}
												loadingText="Menandatangani..."
												disabled={isAnySigning}
												on:click={() => signRecord(record.id)}
											>
												Tanda Tangani
											</LoadingButton>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Action Tips -->
			<div class="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
				<div class="flex">
					<svg class="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
					</svg>
					<div class="text-sm text-yellow-800">
						<p class="font-medium">Panduan Tanda Tangan Digital:</p>
						<ul class="mt-1 list-disc list-inside space-y-1">
							<li><strong>Tanda Tangani:</strong> Memberikan tanda tangan digital pertama kali</li>
							<li><strong>Tanda Tangani Ulang:</strong> Memperbarui tanda tangan digital (misalnya setelah data diubah)</li>
							<li><strong>Hapus TTD:</strong> Menghapus tanda tangan digital (transkrip menjadi tidak terverifikasi)</li>
						</ul>
					</div>
				</div>
			</div>
		{:else}
			<div class="text-center py-12">
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
					<svg class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<p class="text-sm text-gray-500 font-medium">Belum Ada Transkrip</p>
				<p class="text-xs text-gray-400 mt-1">Belum ada transkrip yang perlu ditandatangani.</p>
			</div>
		{/if}
	</div>
	
	<svelte:fragment slot="footer">
		<div class="flex justify-end">
			<LoadingButton 
				variant="secondary"
				on:click={handleClose}
				disabled={isAnySigning}
			>
				Tutup
			</LoadingButton>
		</div>
	</svelte:fragment>
</BaseModal>