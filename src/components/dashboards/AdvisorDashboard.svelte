<script lang="ts">
	import ActionCard from '../shared/ActionCard.svelte';
	import TranscriptInputFormModal from '../modals/TranscriptInputFormModal.svelte';
	import GroupDecryptFormModal from '../modals/GroupDecryptFormModal.svelte';
	import PDFFormModal from '../modals/PDFFormModal.svelte';
	import TranscriptViewModal from '../modals/TranscriptViewModal.svelte';
	import StudentListModal from '../modals/StudentListModal.svelte';
	import { VerificationStatus } from '$lib/types/academic.types';

	export let data: any;
	export let form: any;

	$: user = data.userContext.user;
	$: students = data.adviseeStudents || [];
	$: allRecords = data.allRecords || [];
	$: allStudentsWithTranscripts = data.allStudentsWithTranscripts || [];

	// Modal states
	let showInputModal = false;
	let showGroupDecryptModal = false;
	let showPdfModal = false;
	let showStudentsModal = false;
	let showTranscriptViewModal = false;

	// Transcript viewer state
	let viewedTranscript: any = null;

	// Close input form on success (only for input actions)
	$: if (form && 'success' in form && form.success && !form.groupDecryptSuccess && !form.record) {
		showInputModal = false;
	}

	// Handle view record response for advisor - but don't interfere with group decrypt
	$: if (form && 'success' in form && form.success && form.record && !form.groupDecryptSuccess) {
		viewedTranscript = {
			...form.record,
			verificationStatus: form.verification?.isValid ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED,
			verificationMessage: form.verification?.message || 'Unknown status'
		};
		showTranscriptViewModal = true;
		showStudentsModal = false;
	}

	function closeTranscriptView() {
		viewedTranscript = null;
		showTranscriptViewModal = false;
	}

	function openInputModal() {
		showInputModal = true;
	}

	function openGroupDecryptModal() {
		showGroupDecryptModal = true;
	}

	function openStudentsModal() {
		showStudentsModal = true;
	}

	function openPdfModal() {
		showPdfModal = true;
	}

	// Listen for open input form event from student list modal
	if (typeof window !== 'undefined') {
		window.addEventListener('openInputForm', () => {
			showStudentsModal = false;
			showInputModal = true;
		});
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
				<ActionCard
					title="Input Data Mahasiswa"
					description="Masukkan data nilai mahasiswa bimbingan"
					actionText="Mulai Input"
					color="blue"
					icon="📝"
					on:click={openInputModal}
				/>

				<!-- Group Decrypt -->
				<ActionCard
					title="Dekripsi Grup"
					description="Buka data transkrip bersama dosen lain"
					actionText="Mulai Proses"
					color="yellow"
					icon="🔐"
					on:click={openGroupDecryptModal}
				/>

				<!-- View My Students -->
				<ActionCard
					title="Mahasiswa Bimbingan"
					description="Lihat daftar dan transkrip mahasiswa bimbingan"
					actionText="Lihat Daftar"
					color="green"
					icon="👥"
					on:click={openStudentsModal}
				/>

				<!-- Generate PDF -->
				<ActionCard
					title="Cetak PDF"
					description="Generate transkrip dalam format PDF"
					actionText="Generate PDF"
					color="purple"
					icon="📄"
					on:click={openPdfModal}
				/>
			</div>
		</div>
	</div>

	<!-- Modals -->
	<TranscriptInputFormModal 
		bind:show={showInputModal}
		{students}
	/>

	<GroupDecryptFormModal 
		bind:show={showGroupDecryptModal}
		{allStudentsWithTranscripts}
		{form}
		currentUser={user}
	/>

	<StudentListModal 
		bind:show={showStudentsModal}
		{students}
		title="Mahasiswa Bimbingan Anda"
	/>

	<TranscriptViewModal 
		bind:show={showTranscriptViewModal}
		transcript={viewedTranscript}
		allowBack={false}
		on:close={closeTranscriptView}
	/>

	<PDFFormModal 
		bind:show={showPdfModal}
		availableRecords={allRecords}
		userRole="Dosen_Wali"
	/>
</div>