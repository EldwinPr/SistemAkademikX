<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';
	import TranscriptViewer from '../shared/TranscriptViewer.svelte';
	import PDFForm from '../forms/PDFForm.svelte';
	import UserManagementModal from '../forms/UserManagementModal.svelte';

	export let data: any;
	export let form: any;

	$: user = data.userContext.user;
	$: programRecords = data.programRecords || [];
	$: allAdvisors = data.allAdvisors || [];
	$: allStudents = data.allStudents || [];

	// View states
	let showAllTranscriptsView = false;
	let showSigningView = false;
	let showPdfForm = false;
	let showUserManagementModal = false;
	let showKeyManagementModal = false;

	// Transcript viewer state
	let showTranscriptModal = false;
	let viewedTranscript: any = null;

	// Delete confirmation state
	let showDeleteConfirm = false;
	let transcriptToDelete: any = null;

	// Handle view record response
	$: if (form && 'success' in form && form.success && form.record) {
		viewedTranscript = {
			...form.record,
			verificationStatus: form.verification?.isValid ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED,
			verificationMessage: form.verification?.message || 'Unknown status'
		};
		showTranscriptModal = true;
		showAllTranscriptsView = false;
	}

	function translateProgram(program: string): string {
		switch (program) {
			case 'Teknik_Informatika': return 'Teknik Informatika';
			case 'Sistem_Teknologi_Informasi': return 'Sistem dan Teknologi Informasi';
			default: return program;
		}
	}

	function closeTranscriptView() {
		viewedTranscript = null;
		showTranscriptModal = false;
	}

	function confirmDeleteTranscript(record: any) {
		transcriptToDelete = record;
		showDeleteConfirm = true;
	}

	function cancelDeleteTranscript() {
		transcriptToDelete = null;
		showDeleteConfirm = false;
	}

	function closeKeyManagement() {
		showKeyManagementModal = false;
	}
</script>

<div class="space-y-6">
	<!-- Success/Error Messages -->
	{#if form?.message}
		<div class="rounded-md bg-green-100 p-4 text-sm text-green-700">
			{form.message}
		</div>
	{/if}
	{#if form?.error}
		<div class="rounded-md bg-red-100 p-4 text-sm text-red-700">
			{form.error}
		</div>
	{/if}

	<!-- PDF Form -->
	<PDFForm 
		availableRecords={programRecords}
		userRole="Kepala_Program_Studi"
		bind:showForm={showPdfForm}
	/>

	<!-- User Management Modal -->
	<UserManagementModal 
		{allAdvisors}
		{allStudents}
		currentUserProgram={user.programStudi}
		bind:showModal={showUserManagementModal}
	/>

	<!-- Key Management Modal (Placeholder) -->
	{#if showKeyManagementModal}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={closeKeyManagement}></div>
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-md">
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold text-gray-900">Kelola Kunci</h3>
							<button type="button" class="text-gray-400 hover:text-gray-600" on:click={closeKeyManagement}>
								<span class="text-2xl">&times;</span>
							</button>
						</div>
					</div>
					<div class="p-6 text-center">
						<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
							<svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
							</svg>
						</div>
						<h4 class="text-lg font-medium text-gray-900 mb-2">Fitur Dalam Pengembangan</h4>
						<p class="text-sm text-gray-500 mb-4">
							Manajemen kunci enkripsi sedang dalam tahap pengembangan dan akan segera tersedia.
						</p>
						<button 
							type="button"
							on:click={closeKeyManagement}
							class="rounded-md bg-indigo-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
						>
							Tutup
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Delete Transcript Confirmation Modal -->
	{#if showDeleteConfirm}
		<div class="fixed inset-0 z-60 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75"></div>
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-md">
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<h3 class="text-lg font-semibold text-gray-900">Konfirmasi Hapus Transkrip</h3>
					</div>
					<div class="p-6">
						<p class="text-sm text-gray-600 mb-4">
							Apakah Anda yakin ingin menghapus transkrip 
							<strong>{transcriptToDelete?.student.fullName}</strong> 
							({transcriptToDelete?.student.nim})?
						</p>
						<div class="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
							<p class="text-sm text-red-800">
								⚠️ <strong>Peringatan:</strong> Tindakan ini akan menghapus:
							</p>
							<ul class="text-sm text-red-700 mt-2 list-disc list-inside">
								<li>Data transkrip terenkripsi</li>
								<li>Semua kunci akses (direct keys)</li>
								<li>Semua secret shares untuk grup dekripsi</li>
								<li>Tanda tangan digital</li>
							</ul>
							<p class="text-sm text-red-800 mt-2 font-medium">
								Data yang sudah dihapus tidak dapat dikembalikan!
							</p>
						</div>
						<div class="flex gap-3 justify-end">
							<button 
								type="button"
								on:click={cancelDeleteTranscript}
								class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
							>
								Batal
							</button>
							<form method="POST" action="?/deleteTranscript" class="inline">
								<input type="hidden" name="recordId" value={transcriptToDelete?.id} />
								<button 
									type="submit"
									class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
								>
									Ya, Hapus Transkrip
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Transcript Detail Modal -->
	{#if showTranscriptModal && viewedTranscript}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={closeTranscriptView}></div>
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh]">
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Detail Transkrip Akademik</h3>
							<button type="button" class="text-gray-400 hover:text-gray-600" on:click={closeTranscriptView}>
								<span class="text-2xl">&times;</span>
							</button>
						</div>
					</div>
					<div class="p-6 max-h-[80vh] overflow-y-auto">
						<TranscriptViewer 
							transcript={viewedTranscript} 
							showTitle={false}
							allowClose={false}
						/>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- All Transcripts Modal - With Delete Functionality -->
	{#if showAllTranscriptsView}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={() => {showAllTranscriptsView = false; viewedTranscript = null;}}></div>
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh]">
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Lihat Semua Data Transkrip</h3>
							<button type="button" class="text-gray-400 hover:text-gray-600" on:click={() => {showAllTranscriptsView = false; viewedTranscript = null;}}>
								<span class="text-2xl">&times;</span>
							</button>
						</div>
					</div>
					<div class="p-6 max-h-[80vh] overflow-y-auto">
						<h3 class="font-semibold text-lg mb-4">Daftar Transkrip Program Studi</h3>
						<div class="space-y-3">
							{#each programRecords as record}
								<div class="border rounded-lg p-4 hover:bg-gray-50">
									<div class="flex justify-between items-center">
										<div class="flex-1">
											<p class="font-medium">{record.student.fullName}</p>
											<p class="text-sm text-gray-500">
												{record.student.nim} - Dibuat: {new Date(record.createdAt).toLocaleDateString()}
											</p>
											<p class="text-xs text-gray-400">
												Dibuat oleh: {record.createdBy} • 
												TTD: {record.digitalSignature ? 
													'<span class="text-green-600">Sudah ditandatangani</span>' : 
													'<span class="text-yellow-600">Belum ditandatangani</span>'}
											</p>
										</div>
										<div class="flex gap-2">
											<form method="POST" action="?/viewRecord">
												<input type="hidden" name="recordId" value={record.id} />
												<button 
													type="submit" 
													class="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
												>
													Lihat Detail
												</button>
											</form>
											<button 
												type="button"
												on:click={() => confirmDeleteTranscript(record)}
												class="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm"
											>
												Hapus
											</button>
										</div>
									</div>
								</div>
							{:else}
								<p class="text-sm text-gray-500 text-center py-8">Belum ada data transkrip di program studi ini.</p>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Digital Signing Modal - With Sign/Resign/Remove Options -->
	{#if showSigningView}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={() => showSigningView = false}></div>
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh]">
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Tanda Tangan Digital Transkrip</h3>
							<button type="button" class="text-gray-400 hover:text-gray-600" on:click={() => showSigningView = false}>
								<span class="text-2xl">&times;</span>
							</button>
						</div>
					</div>
					<div class="p-6 max-h-[80vh] overflow-y-auto">
						<div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
							<p class="text-sm text-blue-800">
								ℹ️ <strong>Info:</strong> Kelola tanda tangan digital untuk setiap transkrip. 
								Tanda tangan digital memastikan keaslian dan integritas data akademik.
							</p>
						</div>
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mahasiswa</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status TTD</th>
									<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each programRecords as record}
									<tr class="hover:bg-gray-50">
										<td class="px-6 py-4 whitespace-nowrap">
											<div>
												<div class="text-sm font-medium text-gray-900">{record.student.fullName}</div>
												<div class="text-sm text-gray-500">{record.student.nim}</div>
											</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											{#if record.digitalSignature}
												<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
													Sudah Ditandatangani
												</span>
											{:else}
												<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
													Belum Ditandatangani
												</span>
											{/if}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-right">
											<div class="flex gap-2 justify-end">
												{#if record.digitalSignature}
													<!-- Already signed - show Resign and Remove options -->
													<form method="POST" action="?/signRecord" class="inline">
														<input type="hidden" name="recordId" value={record.id} />
														<button 
															type="submit" 
															class="text-sm font-medium text-blue-600 hover:text-blue-900 px-2 py-1 border border-blue-300 rounded"
														>
															Tanda Tangani Ulang
														</button>
													</form>
													<form method="POST" action="?/removeSignature" class="inline">
														<input type="hidden" name="recordId" value={record.id} />
														<button 
															type="submit" 
															class="text-sm font-medium text-red-600 hover:text-red-900 px-2 py-1 border border-red-300 rounded"
														>
															Hapus TTD
														</button>
													</form>
												{:else}
													<!-- Not signed - show Sign option -->
													<form method="POST" action="?/signRecord" class="inline">
														<input type="hidden" name="recordId" value={record.id} />
														<button 
															type="submit" 
															class="text-sm font-medium text-green-600 hover:text-green-900 px-2 py-1 border border-green-300 rounded"
														>
															Tanda Tangani
														</button>
													</form>
												{/if}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Head Dashboard -->
	<div class="bg-white p-6 shadow-lg rounded-lg">
		<div class="mb-6">
			<h2 class="text-2xl font-semibold text-gray-800">
				Selamat Datang, {user.fullName}!
			</h2>
			<p class="mt-2 text-base text-gray-600">
				Anda masuk sebagai: <span class="font-bold text-indigo-700">Kepala Program Studi</span>
			</p>
			{#if user.programStudi}
				<p class="text-sm text-gray-500">{translateProgram(user.programStudi)}</p>
			{/if}
			<p class="text-sm text-gray-500">Total transkrip: {programRecords.length}</p>
		</div>

		<!-- Head Actions -->
		<div>
			<h3 class="text-xl font-semibold text-gray-800 mb-4">Menu Anda</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				
				<!-- View All Transcripts -->
				<div class="overflow-hidden rounded-lg bg-purple-50 p-5 shadow">
					<h4 class="text-lg font-medium text-purple-900">Lihat Semua Data</h4>
					<p class="mt-1 text-sm text-purple-800">
						Lihat dan kelola seluruh transkrip program studi
					</p>
					<button 
						type="button" 
						on:click={() => (showAllTranscriptsView = true)} 
						class="mt-4 font-semibold text-purple-600 hover:text-purple-800"
					>
						Akses Data &rarr;
					</button>
				</div>

				<!-- Digital Signing -->
				<div class="overflow-hidden rounded-lg bg-red-50 p-5 shadow">
					<h4 class="text-lg font-medium text-red-900">Tanda Tangan Digital</h4>
					<p class="mt-1 text-sm text-red-800">
						Kelola tanda tangan digital untuk transkrip
					</p>
					<button 
						type="button" 
						on:click={() => (showSigningView = true)} 
						class="mt-4 font-semibold text-red-600 hover:text-red-800"
					>
						Kelola TTD &rarr;
					</button>
				</div>

				<!-- Generate PDF -->
				<div class="overflow-hidden rounded-lg bg-green-50 p-5 shadow">
					<h4 class="text-lg font-medium text-green-900">Cetak PDF</h4>
					<p class="mt-1 text-sm text-green-800">
						Generate transkrip dalam format PDF
					</p>
					<button 
						type="button" 
						on:click={() => (showPdfForm = true)}
						class="mt-4 font-semibold text-green-600 hover:text-green-800"
					>
						Generate PDF &rarr;
					</button>
				</div>

				<!-- User Management -->
				<div class="overflow-hidden rounded-lg bg-blue-50 p-5 shadow">
					<h4 class="text-lg font-medium text-blue-900">Kelola Pengguna</h4>
					<p class="mt-1 text-sm text-blue-800">
						Lihat dosen, mahasiswa, dan daftar pengguna baru
					</p>
					<button 
						type="button" 
						on:click={() => (showUserManagementModal = true)}
						class="mt-4 font-semibold text-blue-600 hover:text-blue-800"
					>
						Kelola Pengguna &rarr;
					</button>
				</div>

				<!-- Key Management -->
				<div class="overflow-hidden rounded-lg bg-yellow-50 p-5 shadow">
					<h4 class="text-lg font-medium text-yellow-900">Kelola Kunci</h4>
					<p class="mt-1 text-sm text-yellow-800">
						Administrasi kunci enkripsi dan akses
					</p>
					<button 
						type="button" 
						on:click={() => (showKeyManagementModal = true)}
						class="mt-4 font-semibold text-yellow-600 hover:text-yellow-800"
					>
						Kelola Kunci &rarr;
					</button>
				</div>

			</div>
		</div>
	</div>
</div>