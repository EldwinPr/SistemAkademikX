<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';
	import TranscriptViewer from '../shared/TranscriptViewer.svelte';
	import PDFForm from '../forms/PDFForm.svelte';

	export let data: any;
	export let form: any;

	$: user = data.userContext.user;
	$: availableTranscripts = data.myTranscriptsWithDetails || [];

	// Modal states
	let showTranscriptSelectionModal = false;
	let showTranscriptModal = false;
	let showPdfForm = false;

	// Transcript data
	let viewedTranscript: any = null;

	// Handle form response - when transcript is successfully loaded
	$: if (form && 'myTranscriptSuccess' in form && form.myTranscriptSuccess) {
		viewedTranscript = form.myTranscript;
		showTranscriptSelectionModal = false; // Close selection modal
		showTranscriptModal = true; // Open transcript viewer
	}

	function isTranscriptSigned(transcript: any): boolean {
		if (!transcript) return false;
		return transcript.verificationStatus === 'VERIFIED';
	}

	function getUnsignedMessage(transcript: any): string {
		if (!transcript) return 'No transcript found.';
		
		if (transcript.verificationStatus === 'UNVERIFIED') {
			if (transcript.verificationMessage?.includes('not been signed yet') || 
			    transcript.verificationMessage?.includes('Not signed')) {
				return 'Your transcript is being processed and has not been approved yet. Please wait for the Head of Study Program to sign it.';
			}
			return 'Your transcript signature could not be verified. Please contact your academic advisor.';
		}
		
		return 'Unable to access transcript at this time.';
	}

	function closeTranscriptView() {
		showTranscriptModal = false;
		viewedTranscript = null;
	}

	function closeSelectionModal() {
		showTranscriptSelectionModal = false;
	}

	function openTranscriptSelection() {
		showTranscriptSelectionModal = true;
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

	<!-- Show warning for unsigned transcripts -->
	{#if form && 'myTranscriptSuccess' in form && form.myTranscriptSuccess && !isTranscriptSigned(form.myTranscript)}
		<div class="rounded-md bg-yellow-100 p-4 text-sm text-yellow-700 border border-yellow-200">
			<div class="flex items-start">
				<svg class="h-5 w-5 text-yellow-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
				</svg>
				<div>
					<h3 class="font-medium text-yellow-800">Transcript Not Fully Processed</h3>
					<p class="mt-1">{getUnsignedMessage(form.myTranscript)}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- PDF Form -->
	<PDFForm 
		availableRecords={availableTranscripts}
		userRole="Mahasiswa"
		bind:showForm={showPdfForm}
	/>

	<!-- Transcript Selection Modal -->
	{#if showTranscriptSelectionModal}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={closeSelectionModal}></div>
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-md">
					
					<!-- Modal Header -->
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold text-gray-900">Pilih Transkrip</h3>
							<button type="button" class="text-gray-400 hover:text-gray-600" on:click={closeSelectionModal}>
								<span class="text-2xl">&times;</span>
							</button>
						</div>
					</div>

					<!-- Modal Content -->
					<div class="p-6">
						{#if availableTranscripts.length > 0}
							<p class="text-sm text-gray-600 mb-4">
								Anda memiliki {availableTranscripts.length} transkrip. Pilih yang ingin dilihat:
							</p>
							
							<div class="space-y-3">
								{#each availableTranscripts as transcript, index}
									<form method="POST" action="?/viewMyTranscript" class="w-full">
										<input type="hidden" name="recordId" value={transcript.id} />
										<button 
											type="submit"
											class="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
										>
											<div class="flex justify-between items-center">
												<div>
													<p class="font-medium text-gray-900">
														Transkrip {index + 1}
													</p>
													<p class="text-sm text-gray-500">
														Dibuat: {new Date(transcript.createdAt).toLocaleDateString()}
													</p>
													<p class="text-xs text-gray-400">
														ID: {transcript.id.substring(0, 8)}...
													</p>
												</div>
												<div class="text-right">
													{#if transcript.digitalSignature}
														<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
															✅ Signed
														</span>
													{:else}
														<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
															⏳ Pending
														</span>
													{/if}
												</div>
											</div>
										</button>
									</form>
								{/each}
							</div>

							<!-- Info Box -->
							<div class="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
								<p class="text-xs text-blue-600">
									💡 <strong>Tips:</strong> Transkrip yang sudah ditandatangani (Signed) dapat dicetak sebagai PDF resmi. 
									Transkrip yang masih Pending sedang menunggu persetujuan dari Kepala Program Studi.
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
				</div>
			</div>
		</div>
	{/if}

	<!-- Transcript Viewer Modal -->
	{#if showTranscriptModal && viewedTranscript}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={closeTranscriptView}></div>
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh]">
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Transkrip Akademik Anda</h3>
							<div class="flex items-center gap-3">
								<!-- Back to Selection Button -->
								<button 
									type="button" 
									on:click={() => { closeTranscriptView(); openTranscriptSelection(); }}
									class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
								>
									← Pilih Transkrip Lain
								</button>
								<button type="button" class="text-gray-400 hover:text-gray-600" on:click={closeTranscriptView}>
									<span class="text-2xl">&times;</span>
								</button>
							</div>
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

	<!-- Main Student Dashboard -->
	<div class="bg-white p-6 shadow-lg rounded-lg">
		<div class="mb-6">
			<h2 class="text-2xl font-semibold text-gray-800">
				Selamat Datang, {user.fullName}!
			</h2>
			<p class="mt-2 text-base text-gray-600">
				Anda masuk sebagai: <span class="font-bold text-indigo-700">Mahasiswa</span>
			</p>
			{#if user.nim}
				<p class="text-sm text-gray-500">NIM: {user.nim}</p>
			{/if}
			{#if availableTranscripts.length > 0}
				<p class="text-sm text-blue-600 mt-1">
					📊 Anda memiliki {availableTranscripts.length} transkrip tersedia
				</p>
			{/if}
		</div>

		<!-- Student Actions -->
		<div>
			<h3 class="text-xl font-semibold text-gray-800 mb-4">Menu Anda</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				
				<!-- View Transcript -->
				<div class="overflow-hidden rounded-lg bg-indigo-50 p-5 shadow">
					<h4 class="text-lg font-medium text-indigo-900">Lihat Transkrip</h4>
					<p class="mt-1 text-sm text-indigo-800">
						{#if availableTranscripts.length > 0}
							Akses dan lihat {availableTranscripts.length} transkrip akademik Anda
						{:else}
							Akses data transkrip akademik Anda yang telah disetujui
						{/if}
					</p>
					<button 
						type="button" 
						on:click={openTranscriptSelection}
						disabled={availableTranscripts.length === 0}
						class="mt-4 font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
					>
						{#if availableTranscripts.length > 0}
							Pilih & Buka Transkrip ({availableTranscripts.length}) &rarr;
						{:else}
							Belum Ada Transkrip
						{/if}
					</button>
				</div>

				<!-- Generate PDF -->
				<div class="overflow-hidden rounded-lg bg-green-50 p-5 shadow">
					<h4 class="text-lg font-medium text-green-900">Cetak PDF</h4>
					<p class="mt-1 text-sm text-green-800">
						Generate transkrip dalam format PDF (hanya untuk transkrip yang telah ditandatangani)
					</p>
					<button 
						type="button" 
						on:click={() => (showPdfForm = true)}
						disabled={availableTranscripts.length === 0}
						class="mt-4 font-semibold text-green-600 hover:text-green-800 disabled:text-gray-400 disabled:cursor-not-allowed"
					>
						{#if availableTranscripts.length > 0}
							Generate PDF &rarr;
						{:else}
							Belum Ada Transkrip
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>