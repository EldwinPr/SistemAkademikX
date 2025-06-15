<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';
	import ActionCard from '../shared/ActionCard.svelte';
	import TranscriptViewModal from '../modals/TranscriptViewModal.svelte';
	import TranscriptSelectModal from '../modals/TranscriptSelectModal.svelte';
	import PDFFormModal from '../modals/PDFFormModal.svelte';

	export let data: any;
	export let form: any;

	$: user = data.userContext.user;
	$: availableTranscripts = data.myTranscriptsWithDetails || [];

	// Modal states
	let showTranscriptSelectModal = false;
	let showTranscriptViewModal = false;
	let showPdfModal = false;

	// Transcript data
	let viewedTranscript: any = null;

	// Handle form response - when transcript is successfully loaded
	$: if (form && 'myTranscriptSuccess' in form && form.myTranscriptSuccess) {
		viewedTranscript = {
			...form.myTranscript,
			verificationStatus: form.myTranscript.verificationStatus === 'VERIFIED' ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED,
			verificationMessage: form.myTranscript.verificationMessage || 'Unknown status'
		};
		showTranscriptSelectModal = false;
		showTranscriptViewModal = true;
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
		showTranscriptViewModal = false;
		viewedTranscript = null;
	}

	function openTranscriptSelection() {
		showTranscriptSelectModal = true;
	}

	function openPdfModal() {
		showPdfModal = true;
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
				<ActionCard
					title="Lihat Transkrip"
					description={availableTranscripts.length > 0 
						? `Akses dan lihat ${availableTranscripts.length} transkrip akademik Anda`
						: 'Akses data transkrip akademik Anda yang telah disetujui'}
					actionText={availableTranscripts.length > 0 
						? `Pilih & Buka Transkrip (${availableTranscripts.length})` 
						: 'Belum Ada Transkrip'}
					color="indigo"
					icon="📊"
					disabled={availableTranscripts.length === 0}
					on:click={openTranscriptSelection}
				/>

				<!-- Generate PDF -->
				<ActionCard
					title="Cetak PDF"
					description="Generate transkrip dalam format PDF (hanya untuk transkrip yang telah ditandatangani)"
					actionText={availableTranscripts.length > 0 ? 'Generate PDF' : 'Belum Ada Transkrip'}
					color="green"
					icon="📄"
					disabled={availableTranscripts.length === 0}
					on:click={openPdfModal}
				/>
			</div>
		</div>
	</div>

	<!-- Modals -->
	<TranscriptSelectModal 
		bind:show={showTranscriptSelectModal}
		{availableTranscripts}
	/>

	<TranscriptViewModal 
		bind:show={showTranscriptViewModal}
		transcript={viewedTranscript}
		allowBack={true}
		on:close={closeTranscriptView}
	/>

	<PDFFormModal 
		bind:show={showPdfModal}
		availableRecords={availableTranscripts}
		userRole="Mahasiswa"
	/>
</div>