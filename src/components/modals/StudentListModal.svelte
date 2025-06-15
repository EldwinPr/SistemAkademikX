<script lang="ts">
	import BaseModal from './BaseModal.svelte';
	import LoadingButton from '../shared/LoadingButton.svelte';
	
	export let show = false;
	export let students: any[] = [];
	export let loading = false;
	export let title = 'Mahasiswa Bimbingan Anda';
	
	function handleClose() {
		show = false;
	}
	
	function openInputForm() {
		// Dispatch event to parent to open input form
		show = false;
		// The parent component should handle opening the input form
		window.dispatchEvent(new CustomEvent('openInputForm'));
	}
	
	function viewTranscript(recordId: string) {
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
	
	function getTranscriptStatus(student: any) {
		if (student.hasTranscript) {
			return {
				text: 'Sudah Ada',
				color: 'green',
				icon: '✅'
			};
		}
		return {
			text: 'Belum Ada',
			color: 'yellow', 
			icon: '⏳'
		};
	}
	
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('id-ID');
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
					<p class="text-gray-600">Memuat daftar mahasiswa...</p>
				</div>
			</div>
		{:else if students.length > 0}
			<div class="mb-4 flex justify-between items-center">
				<p class="text-sm text-gray-600">
					Anda membimbing {students.length} mahasiswa
				</p>
				<LoadingButton
					variant="primary"
					size="sm"
					on:click={openInputForm}
				>
					+ Input Data Baru
				</LoadingButton>
			</div>
			
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Mahasiswa
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Program Studi
							</th>
							<th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status Transkrip
							</th>
							<th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
								Jumlah Transkrip
							</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Aksi
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each students as student}
							{@const status = getTranscriptStatus(student)}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4 whitespace-nowrap">
									<div>
										<div class="text-sm font-medium text-gray-900">
											{student.fullName}
										</div>
										<div class="text-sm text-gray-500">
											{student.nim}
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">
										{#if student.programStudi === 'Teknik_Informatika'}
											Teknik Informatika
										{:else if student.programStudi === 'Sistem_Teknologi_Informasi'}
											Sistem dan Teknologi Informasi
										{:else}
											{student.programStudi || 'Tidak diketahui'}
										{/if}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-center">
									<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-{status.color}-100 text-{status.color}-800">
										{status.icon} {status.text}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-center">
									<div class="text-sm text-gray-900">
										{student.transcriptRecords?.length || 0}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right">
									<div class="flex gap-2 justify-end">
										<!-- Input Data Button -->
										<LoadingButton 
											variant="primary"
											size="sm"
											on:click={openInputForm}
										>
											Input Data
										</LoadingButton>
										
										<!-- View Transcript Button(s) -->
										{#if student.hasTranscript}
											{#if student.transcriptRecords && student.transcriptRecords.length === 1}
												<!-- Single transcript - direct button -->
												<LoadingButton 
													variant="secondary"
													size="sm"
													on:click={() => viewTranscript(student.transcriptRecords[0].id)}
												>
													Lihat Transkrip
												</LoadingButton>
											{:else if student.transcriptRecords && student.transcriptRecords.length > 1}
												<!-- Multiple transcripts - dropdown -->
												<div class="relative inline-block">
													<select 
														class="text-blue-600 border border-blue-300 rounded text-xs px-2 py-1 pr-6"
														on:change={(e) => {
															const recordId = (e.target as HTMLSelectElement).value;
															if (recordId) {
																viewTranscript(recordId);
															}
														}}
													>
														<option value="">Pilih Transkrip...</option>
														{#each student.transcriptRecords as record, index}
															<option value={record.id}>
																Transkrip {index + 1} ({formatDate(record.createdAt)})
															</option>
														{/each}
													</select>
												</div>
											{/if}
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Summary Cards -->
			<div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
							</svg>
						</div>
						<div class="ml-4">
							<div class="text-lg font-medium text-blue-900">
								{students.length}
							</div>
							<div class="text-sm text-blue-700">
								Total Mahasiswa Bimbingan
							</div>
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
								{students.filter(s => s.hasTranscript).length}
							</div>
							<div class="text-sm text-green-700">
								Sudah Ada Transkrip
							</div>
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
								{students.filter(s => !s.hasTranscript).length}
							</div>
							<div class="text-sm text-yellow-700">
								Belum Ada Transkrip
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Action Tip -->
			<div class="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
				<p class="text-sm text-blue-600">
					💡 <strong>Tips:</strong> Klik "Input Data" untuk menambahkan transkrip baru untuk mahasiswa. 
					Gunakan fitur "Dekripsi Grup" untuk melihat transkrip mahasiswa bimbingan dosen lain.
				</p>
			</div>
		{:else}
			<div class="text-center py-12">
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
					<svg class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
					</svg>
				</div>
				<p class="text-sm text-gray-500 font-medium">Belum Ada Mahasiswa Bimbingan</p>
				<p class="text-xs text-gray-400 mt-1">Anda belum memiliki mahasiswa yang dibimbing.</p>
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