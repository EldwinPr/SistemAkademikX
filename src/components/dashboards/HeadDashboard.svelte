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

	// Transcript viewer state
	let viewedTranscript: any = null;

	// Handle view record response
	$: if (form && 'viewSuccess' in form && form.viewSuccess) {
		viewedTranscript = form.viewedRecord;
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
		bind:showModal={showUserManagementModal}
	/>

	<!-- All Transcripts Modal -->
	{#if showAllTranscriptsView}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={() => {showAllTranscriptsView = false; viewedTranscript = null;}}></div>
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-6xl">
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Daftar Transkrip Program Studi</h3>
							<button type="button" class="text-gray-400 hover:text-gray-600" on:click={() => {showAllTranscriptsView = false; viewedTranscript = null;}}>
								<span class="text-2xl">&times;</span>
							</button>
						</div>
					</div>
					<div class="p-6 max-h-96 overflow-y-auto">
						<div class="grid md:grid-cols-2 gap-8">
							<!-- Record List -->
							<div class="border-r-0 md:border-r pr-0 md:pr-8">
								<h3 class="font-semibold text-lg">Pilih Record</h3>
								<ul class="mt-4 space-y-2 max-h-80 overflow-y-auto">
									{#each programRecords as record}
										<li>
											<form method="POST" action="?/viewRecord">
												<input type="hidden" name="recordId" value={record.id} />
												<button type="submit" class="text-left w-full p-3 rounded-md hover:bg-gray-100">
													<p class="font-medium">{record.student.fullName}</p>
													<p class="text-sm text-gray-500">
														{record.student.nim} - Dibuat: {new Date(record.createdAt).toLocaleDateString()}
													</p>
												</button>
											</form>
										</li>
									{:else}
										<p class="text-sm text-gray-500">Belum ada data transkrip di program studi ini.</p>
									{/each}
								</ul>
							</div>
							
							<!-- Record Details -->
							<div>
								<h3 class="font-semibold text-lg">Detail Transkrip</h3>
								{#if viewedTranscript}
									<div class="mt-4 max-h-80 overflow-y-auto">
										<TranscriptViewer 
											transcript={viewedTranscript} 
											showTitle={false}
											allowClose={false}
										/>
									</div>
								{:else}
									<div class="mt-4 text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
										Pilih record dari daftar di sebelah kiri untuk melihat detailnya.
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Digital Signing Modal -->
	{#if showSigningView}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={() => showSigningView = false}></div>
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-4xl">
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Tanda Tangan Digital Transkrip</h3>
							<button type="button" class="text-gray-400 hover:text-gray-600" on:click={() => showSigningView = false}>
								<span class="text-2xl">&times;</span>
							</button>
						</div>
					</div>
					<div class="p-6 max-h-96 overflow-y-auto">
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
											<form method="POST" action="?/signRecord">
												<input type="hidden" name="recordId" value={record.id} />
												<button 
													type="submit" 
													class="text-sm font-medium text-indigo-600 hover:text-indigo-900"
												>
													Tanda Tangani Ulang
												</button>
											</form>
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
						Akses seluruh transkrip program studi
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
						Tanda tangani data akademik secara digital
					</p>
					<button 
						type="button" 
						on:click={() => (showSigningView = true)} 
						class="mt-4 font-semibold text-red-600 hover:text-red-800"
					>
						Buka Menu &rarr;
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
					<a 
						href="/dashboard/keys" 
						class="mt-4 inline-block font-semibold text-yellow-600 hover:text-yellow-800"
					>
						Kelola Kunci &rarr;
					</a>
				</div>

			</div>
		</div>
	</div>
</div>