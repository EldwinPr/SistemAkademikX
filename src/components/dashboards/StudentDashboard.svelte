<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';
	import TranscriptViewer from '../shared/TranscriptViewer.svelte';
	import PDFForm from '../forms/PDFForm.svelte';

	export let data: any;
	export let form: any;

	$: user = data.userContext.user;
	$: programRecords = data.programRecords || [];

	// Show transcript if form action succeeded
	$: showTranscript = form && 'myTranscriptSuccess' in form && form.myTranscriptSuccess;
	$: transcript = form?.myTranscript;

	// PDF form state
	let showPdfForm = false;

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
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-4xl">
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Transkrip Akademik Anda</h3>
							<button type="button" class="text-gray-400 hover:text-gray-600" on:click={closeTranscriptView}>
								<span class="text-2xl">&times;</span>
							</button>
						</div>
					</div>
					<div class="p-6 max-h-96 overflow-y-auto">
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
						Akses data transkrip akademik Anda
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

			</div>
		</div>
	</div>
</div>