<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';
	import TranscriptViewer from '../shared/TranscriptViewer.svelte';
	import PDFForm from '../forms/PDFForm.svelte';

	export let data: any;
	export let form: any;

	$: user = data.userContext.user;
	$: programRecords = data.programRecords || [];

	// Show transcript if form action succeeded AND transcript is signed
	$: showTranscript = form && 'myTranscriptSuccess' in form && form.myTranscriptSuccess && isTranscriptSigned(form.myTranscript);
	$: transcript = form?.myTranscript;

	// PDF form state
	let showPdfForm = false;

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
		showTranscript = false;
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

	{#if form && 'myTranscriptSuccess' in form && form.myTranscriptSuccess && !isTranscriptSigned(form.myTranscript)}
		<div class="rounded-md bg-yellow-100 p-4 text-sm text-yellow-700 border border-yellow-200">
			<div class="flex items-start">
				<svg class="h-5 w-5 text-yellow-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
				</svg>
				<div>
					<h3 class="font-medium text-yellow-800">Transcript Not Available</h3>
					<p class="mt-1">{getUnsignedMessage(form.myTranscript)}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- PDF Form -->
	<PDFForm 
		availableRecords={programRecords}
		userRole="Mahasiswa"
		bind:showForm={showPdfForm}
	/>

	<!-- My Transcript Modal using TranscriptViewer -->
	{#if showTranscript && transcript}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={closeTranscriptView}></div>
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh]">
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Transkrip Akademik Anda</h3>
							<button type="button" class="text-gray-400 hover:text-gray-600" on:click={closeTranscriptView}>
								<span class="text-2xl">&times;</span>
							</button>
						</div>
					</div>
					<div class="p-6 max-h-[80vh] overflow-y-auto">
						<TranscriptViewer 
							{transcript} 
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
		</div>

		<!-- Student Actions -->
		<div>
			<h3 class="text-xl font-semibold text-gray-800 mb-4">Menu Anda</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				
				<!-- View Transcript -->
				<div class="overflow-hidden rounded-lg bg-indigo-50 p-5 shadow">
					<h4 class="text-lg font-medium text-indigo-900">Lihat Transkrip</h4>
					<p class="mt-1 text-sm text-indigo-800">
						Akses data transkrip akademik Anda yang telah disetujui
					</p>
					<form method="POST" action="?/viewMyTranscript" class="mt-4">
						<button 
							type="submit" 
							class="font-semibold text-indigo-600 hover:text-indigo-800"
						>
							Buka Transkrip &rarr;
						</button>
					</form>
				</div>

				<!-- Generate PDF -->
				<div class="overflow-hidden rounded-lg bg-green-50 p-5 shadow">
					<h4 class="text-lg font-medium text-green-900">Cetak PDF</h4>
					<p class="mt-1 text-sm text-green-800">
						Generate transkrip dalam format PDF (hanya untuk transkrip yang telah disetujui)
					</p>
					<button 
						type="button" 
						on:click={() => (showPdfForm = true)}
						class="mt-4 font-semibold text-green-600 hover:text-green-800"
					>
						Generate PDF &rarr;
					</button>
				</div>
			</div>
		</div>
	</div>
</div>