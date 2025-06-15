<script lang="ts">
	import BaseModal from './BaseModal.svelte';
	import LoadingButton from '../shared/LoadingButton.svelte';
	import DeleteConfirmModal from './DeleteConfirmModal.svelte';
	
	export let show = false;
	export let records: any[] = [];
	export let title = 'Daftar Transkrip';
	export let loading = false;
	export let canDelete = false;
	export let canView = true;
	
	// Delete confirmation state
	let showDeleteConfirm = false;
	let transcriptToDelete: any = null;
	
	function handleClose() {
		show = false;
	}
	
	function viewRecord(recordId: string) {
		// Create and submit form to view the record
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/viewRecord';
		
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = 'recordId';
		input.value = recordId;
		
		form.appendChild(input);
		document.body.appendChild(form);
		form.submit();
		document.body.removeChild(form);
	}
	
	function confirmDeleteTranscript(record: any) {
		transcriptToDelete = record;
		showDeleteConfirm = true;
	}
	
	function cancelDelete() {
		transcriptToDelete = null;
		showDeleteConfirm = false;
	}
	
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('id-ID');
	}
	
	function getSignatureStatus(digitalSignature: string) {
		if (digitalSignature && digitalSignature.trim() !== '') {
			return {
				text: 'Sudah ditandatangani',
				color: 'green',
				icon: '✅'
			};
		}
		return {
			text: 'Belum ditandatangani', 
			color: 'yellow',
			icon: '⏳'
		};
	}
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
			<div class="mb-4">
				<p class="text-sm text-gray-600">
					Menampilkan {records.length} transkrip yang tersedia
				</p>
			</div>
			
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
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status TTD
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Dibuat Oleh
							</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Aksi
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each records as record}
							{@const signatureStatus = getSignatureStatus(record.digitalSignature)}
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
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-{signatureStatus.color}-100 text-{signatureStatus.color}-800">
										{signatureStatus.icon} {signatureStatus.text}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-500">
										{record.createdBy || 'System'}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<div class="flex gap-2 justify-end">
										{#if canView}
											<LoadingButton
												variant="primary"
												size="sm"
												on:click={() => viewRecord(record.id)}
											>
												Lihat Detail
											</LoadingButton>
										{/if}
										{#if canDelete}
											<LoadingButton
												variant="danger"
												size="sm"
												on:click={() => confirmDeleteTranscript(record)}
											>
												Hapus
											</LoadingButton>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="text-center py-12">
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
					<svg class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<p class="text-sm text-gray-500 font-medium">Belum Ada Transkrip</p>
				<p class="text-xs text-gray-400 mt-1">Belum ada data transkrip yang tersedia.</p>
			</div>
		{/if}
	</div>
	
	<svelte:fragment slot="footer">
		<div class="flex justify-end">
			<LoadingButton 
				variant="secondary"
				on:click={handleClose}
			>
				Tutup
			</LoadingButton>
		</div>
	</svelte:fragment>
</BaseModal>

<!-- Delete Confirmation Modal -->
<DeleteConfirmModal 
	bind:show={showDeleteConfirm}
	title="Konfirmasi Hapus Transkrip"
	message="Apakah Anda yakin ingin menghapus transkrip"
	itemName={transcriptToDelete?.student?.fullName ? `${transcriptToDelete.student.fullName} (${transcriptToDelete.student.nim})` : ''}
	warningItems={[
		'Data transkrip terenkripsi',
		'Semua kunci akses (direct keys)', 
		'Semua secret shares untuk grup dekripsi',
		'Tanda tangan digital'
	]}
	actionUrl="?/deleteTranscript"
	hiddenFields={{ recordId: transcriptToDelete?.id || '' }}
	variant="danger"
	on:close={cancelDelete}
/>