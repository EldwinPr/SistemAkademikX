<script lang="ts">
	import TranscriptInputForm from '../forms/TranscriptInputForm.svelte';
	import GroupDecryptForm from '../forms/GroupDecryptForm.svelte';
	import PDFForm from '../forms/PDFForm.svelte';
	import TranscriptViewer from '../shared/TranscriptViewer.svelte';
	import { VerificationStatus } from '$lib/types/academic.types';

	export let data: any;
	export let form: any;

	$: user = data.userContext.user;
	$: students = data.adviseeStudents || [];
	$: allRecords = data.allRecords || [];
	$: allStudentsWithTranscripts = data.allStudentsWithTranscripts || [];

	// Form visibility states
	let showInputForm = false;
	let showGroupDecryptForm = false;
	let showPdfForm = false;
	let showStudentsView = false;

	// Transcript viewer state
	let showTranscriptModal = false;
	let viewedTranscript: any = null;

	// Close input form on success (only for input actions)
	$: if (form && 'success' in form && form.success && !form.groupDecryptSuccess && !form.record) {
		showInputForm = false;
	}

	// Handle view record response for advisor - but don't interfere with group decrypt
	$: if (form && 'success' in form && form.success && form.record && !form.groupDecryptSuccess) {
		viewedTranscript = {
			...form.record,
			verificationStatus: form.verification?.isValid ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED,
			verificationMessage: form.verification?.message || 'Unknown status'
		};
		showTranscriptModal = true;
		showStudentsView = false;
	}

	function closeTranscriptView() {
		viewedTranscript = null;
		showTranscriptModal = false;
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

	<!-- Transcript Input Form -->
	<TranscriptInputForm {students} bind:showForm={showInputForm} />

	<!-- Group Decrypt Form -->
	<GroupDecryptForm 
    {allStudentsWithTranscripts}
    {form}
    currentUser={user}
    bind:showForm={showGroupDecryptForm} 
	/>

	<!-- PDF Form -->
	<PDFForm 
		availableRecords={allRecords}
		userRole="Dosen_Wali"
		bind:showForm={showPdfForm}
	/>

	<!-- Transcript Detail Modal -->
	{#if showTranscriptModal && viewedTranscript}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={closeTranscriptView}></div>
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh]">
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Detail Transkrip Mahasiswa</h3>
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

	<!-- Students View Modal -->
	{#if showStudentsView}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={() => showStudentsView = false}></div>
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh]">
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Mahasiswa Bimbingan Anda</h3>
							<button type="button" class="text-gray-400 hover:text-gray-600" on:click={() => showStudentsView = false}>
								<span class="text-2xl">&times;</span>
							</button>
						</div>
					</div>
					<div class="p-6 max-h-[80vh] overflow-y-auto">
						{#if students.length > 0}
							<div class="overflow-x-auto">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIM</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Transkrip</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
										</tr>
									</thead>
									<tbody class="bg-white divide-y divide-gray-200">
										{#each students as student}
											<tr class="hover:bg-gray-50">
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm font-medium text-gray-900">{student.fullName}</div>
												</td>
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm text-gray-500">{student.nim}</div>
												</td>
												<td class="px-6 py-4 whitespace-nowrap">
													{#if student.hasTranscript}
														<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
															Sudah Ada
														</span>
													{:else}
														<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
															Belum Ada
														</span>
													{/if}
												</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
													<div class="flex gap-2">
														<!-- Input Data Button -->
														<button 
															type="button" 
															on:click={() => {showStudentsView = false; showInputForm = true;}}
															class="text-indigo-600 hover:text-indigo-900 px-2 py-1 border border-indigo-300 rounded text-xs"
														>
															Input Data
														</button>
														
														<!-- View Transcript Button - Show dropdown if multiple transcripts -->
														{#if student.hasTranscript}
															{#if student.transcriptRecords && student.transcriptRecords.length === 1}
																<!-- Single transcript - direct button -->
																<form method="POST" action="?/viewRecord" class="inline">
																	<input type="hidden" name="recordId" value={student.transcriptRecords[0].id} />
																	<button 
																		type="submit" 
																		class="text-blue-600 hover:text-blue-900 px-2 py-1 border border-blue-300 rounded text-xs"
																	>
																		Lihat Transkrip
																	</button>
																</form>
															{:else if student.transcriptRecords && student.transcriptRecords.length > 1}
																<!-- Multiple transcripts - dropdown -->
																<div class="relative inline-block">
																	<select 
																		class="text-blue-600 border border-blue-300 rounded text-xs px-2 py-1 pr-6"
																		on:change={(e) => {
																			const recordId = (e.target as HTMLSelectElement).value;
																			if (recordId) {
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
																			}
																		}}
																	>
																		<option value="">Pilih Transkrip...</option>
																		{#each student.transcriptRecords as record, index}
																			<option value={record.id}>
																				Transkrip {index + 1} ({new Date(record.createdAt).toLocaleDateString()})
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
						{:else}
							<div class="text-center py-8">
								<p class="text-sm text-gray-500">Anda belum memiliki mahasiswa bimbingan.</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Advisor Dashboard -->
	<div class="bg-white p-6 shadow-lg rounded-lg">
		<div class="mb-6">
			<h2 class="text-2xl font-semibold text-gray-800">
				Selamat Datang, {user.fullName}!
			</h2>
			<p class="mt-2 text-base text-gray-600">
				Anda masuk sebagai: <span class="font-bold text-indigo-700">Dosen Wali</span>
			</p>
			<p class="text-sm text-gray-500">Mahasiswa bimbingan: {students.length} orang</p>
		</div>

		<!-- Advisor Actions -->
		<div>
			<h3 class="text-xl font-semibold text-gray-800 mb-4">Menu Anda</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				
				<!-- Input Student Data -->
				<div class="overflow-hidden rounded-lg bg-blue-50 p-5 shadow">
					<h4 class="text-lg font-medium text-blue-900">Input Data Mahasiswa</h4>
					<p class="mt-1 text-sm text-blue-800">
						Masukkan data nilai mahasiswa bimbingan
					</p>
					<button 
						type="button" 
						on:click={() => (showInputForm = true)} 
						class="mt-4 font-semibold text-blue-600 hover:text-blue-800"
					>
						Mulai Input &rarr;
					</button>
				</div>

				<!-- Group Decrypt -->
				<div class="overflow-hidden rounded-lg bg-yellow-50 p-5 shadow">
					<h4 class="text-lg font-medium text-yellow-900">Dekripsi Grup</h4>
					<p class="mt-1 text-sm text-yellow-800">
						Buka data transkrip bersama dosen lain
					</p>
					<button 
						type="button" 
						on:click={() => (showGroupDecryptForm = true)} 
						class="mt-4 font-semibold text-yellow-600 hover:text-yellow-800"
					>
						Mulai Proses &rarr;
					</button>
				</div>

				<!-- View My Students -->
				<div class="overflow-hidden rounded-lg bg-green-50 p-5 shadow">
					<h4 class="text-lg font-medium text-green-900">Mahasiswa Bimbingan</h4>
					<p class="mt-1 text-sm text-green-800">
						Lihat daftar dan transkrip mahasiswa bimbingan
					</p>
					<button 
						type="button" 
						on:click={() => (showStudentsView = true)}
						class="mt-4 font-semibold text-green-600 hover:text-green-800"
					>
						Lihat Daftar &rarr;
					</button>
				</div>

				<!-- Generate PDF -->
				<div class="overflow-hidden rounded-lg bg-purple-50 p-5 shadow">
					<h4 class="text-lg font-medium text-purple-900">Cetak PDF</h4>
					<p class="mt-1 text-sm text-purple-800">
						Generate transkrip dalam format PDF
					</p>
					<button 
						type="button" 
						on:click={() => (showPdfForm = true)}
						class="mt-4 font-semibold text-purple-600 hover:text-purple-800"
					>
						Generate PDF &rarr;
					</button>
				</div>

			</div>
		</div>
	</div>
</div>