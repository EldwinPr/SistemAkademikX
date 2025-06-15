<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';
	import ActionCard from '../shared/ActionCard.svelte';
	import TranscriptViewModal from '../modals/TranscriptViewModal.svelte';
	import TranscriptListModal from '../modals/TranscriptListModal.svelte';
	import SigningModal from '../modals/SigningModal.svelte';
	import PDFFormModal from '../modals/PDFFormModal.svelte';
	import UserManagementModal from '../modals/UserManagementModal.svelte';

	export let data: any;
	export let form: any;

	$: user = data.userContext.user;
	$: programRecords = data.programRecords || [];
	$: allAdvisors = data.allAdvisors || [];
	$: allStudents = data.allStudents || [];

	// Modal states
	let showTranscriptListModal = false;
	let showSigningModal = false;
	let showPdfModal = false;
	let showUserManagementModal = false;
	let showKeyManagementModal = false;
	let showTranscriptViewModal = false;

	// Transcript viewer state
	let viewedTranscript: any = null;

	// Handle view record response
	$: if (form && 'success' in form && form.success && form.record) {
		viewedTranscript = {
			...form.record,
			verificationStatus: form.verification?.isValid ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED,
			verificationMessage: form.verification?.message || 'Unknown status'
		};
		showTranscriptViewModal = true;
		showTranscriptListModal = false;
	}

	function translateProgram(program: string): string {
		switch (program) {
			case 'Teknik_Informatika': return 'Teknik Informatika';
			case 'Sistem_Teknologi_Informasi': return 'Sistem dan Teknologi Informasi';
			default: return program;
		}
	}

	function closeTranscriptView() {
		showTranscriptViewModal = false;
		viewedTranscript = null;
	}

	function openTranscriptListModal() {
		showTranscriptListModal = true;
	}

	function openSigningModal() {
		showSigningModal = true;
	}

	function openPdfModal() {
		showPdfModal = true;
	}

	function openUserManagementModal() {
		showUserManagementModal = true;
	}

	function openKeyManagementModal() {
		showKeyManagementModal = true;
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
				<ActionCard
					title="Lihat Semua Data"
					description="Lihat dan kelola seluruh transkrip program studi"
					actionText="Akses Data"
					color="purple"
					icon="📊"
					on:click={openTranscriptListModal}
				/>

				<!-- Digital Signing -->
				<ActionCard
					title="Tanda Tangan Digital"
					description="Kelola tanda tangan digital untuk transkrip"
					actionText="Kelola TTD"
					color="red"
					icon="✍️"
					on:click={openSigningModal}
				/>

				<!-- Generate PDF -->
				<ActionCard
					title="Cetak PDF"
					description="Generate transkrip dalam format PDF"
					actionText="Generate PDF"
					color="green"
					icon="📄"
					on:click={openPdfModal}
				/>

				<!-- User Management -->
				<ActionCard
					title="Kelola Pengguna"
					description="Lihat dosen, mahasiswa, dan daftar pengguna baru"
					actionText="Kelola Pengguna"
					color="blue"
					icon="👥"
					on:click={openUserManagementModal}
				/>

				<!-- Key Management -->
				<ActionCard
					title="Kelola Kunci"
					description="Administrasi kunci enkripsi dan akses"
					actionText="Kelola Kunci"
					color="yellow"
					icon="🔐"
					on:click={openKeyManagementModal}
				/>
			</div>
		</div>
	</div>

	<!-- Modals -->
	<TranscriptListModal 
		bind:show={showTranscriptListModal}
		records={programRecords}
		title="Daftar Transkrip Program Studi"
		canDelete={true}
		canView={true}
	/>

	<SigningModal 
		bind:show={showSigningModal}
		records={programRecords}
		title="Tanda Tangan Digital Transkrip"
	/>

	<TranscriptViewModal 
		bind:show={showTranscriptViewModal}
		transcript={viewedTranscript}
		allowBack={true}
		on:close={closeTranscriptView}
	/>

	<PDFFormModal 
		bind:show={showPdfModal}
		availableRecords={programRecords}
		userRole="Kepala_Program_Studi"
	/>

	<UserManagementModal 
		bind:show={showUserManagementModal}
		{allAdvisors}
		{allStudents}
		currentUserProgram={user.programStudi}
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
</div>