<script lang="ts">
	import BaseModal from './BaseModal.svelte';
	import LoadingButton from '../shared/LoadingButton.svelte';
	import { VerificationStatus } from '$lib/types/academic.types';
	
	export let show = false;
	export let allStudentsWithTranscripts: any[] = [];
	export let form: any = null;
	export let currentUser: any = null;

	// Two-step selection
	let selectedStudentId = '';
	let selectedRecordId = '';
	let availableTranscripts: any[] = [];

	let userShare = { x: '', y: '' }; // User's own share
	let isLoadingUserShare = false;
	let isSubmitting = false; // Local loading state
	
	// Manual entry for 2 additional shares
	let share2X = '';
	let share2Y = '';
	let share3X = '';
	let share3Y = '';

	// Copy functionality
	let copyMessage = '';
	let copyTimeout: any = null;

	// When student is selected, update available transcripts
	$: if (selectedStudentId) {
		const selectedStudent = allStudentsWithTranscripts.find(s => s.id === selectedStudentId);
		availableTranscripts = selectedStudent?.records || [];
		selectedRecordId = ''; // Reset transcript selection
		userShare = { x: '', y: '' }; // Reset share
	}

	// When transcript is selected, fetch user's share
	$: if (selectedRecordId && currentUser) {
		fetchUserShare(selectedRecordId);
	}

	// Watch for form response changes
	$: if (form && form.groupDecryptSuccess) {
		// Stop loading when we get a response
		isSubmitting = false;
		console.log('✅ Group decrypt successful:', form);
	} else if (form && form.error && isSubmitting) {
		// Stop loading on error
		isSubmitting = false;
		console.error('❌ Group decrypt error:', form.error);
	}

	async function fetchUserShare(recordId: string) {
		console.log('🔍 Fetching user share for record:', recordId);
		isLoadingUserShare = true;
		userShare = { x: '', y: '' };
		
		try {
			const response = await fetch(`/api/shares/${recordId}`);
			
			if (response.ok) {
				const data = await response.json();
				if (data.success && data.share) {
					userShare = {
						x: data.share.shareX.toString(),
						y: data.share.shareY
					};
					console.log('✅ User share loaded:', userShare);
				} else {
					console.log('❌ No share found for current user');
					userShare = { x: 'No share', y: 'found' };
				}
			} else {
				console.error('❌ Error fetching user share:', response.status);
				userShare = { x: 'Error', y: 'loading share' };
			}
		} catch (error) {
			console.error('❌ Network error fetching user share:', error);
			userShare = { x: 'Error', y: 'loading share' };
		} finally {
			isLoadingUserShare = false;
		}
	}

	function handleClose() {
		show = false;
		resetForm();
	}

	function resetForm() {
		selectedStudentId = '';
		selectedRecordId = '';
		availableTranscripts = [];
		userShare = { x: '', y: '' };
		share2X = '';
		share2Y = '';
		share3X = '';
		share3Y = '';
		isSubmitting = false;
		clearCopyMessage();
	}

	function isFormValid() {
		return selectedRecordId && 
			   userShare.x && userShare.y && 
			   share2X && share2Y && 
			   share3X && share3Y &&
			   userShare.x !== 'No share' && 
			   userShare.x !== 'Error';
	}

	// Copy functionality
	async function copyToClipboard(text: string, label: string) {
		try {
			await navigator.clipboard.writeText(text);
			showCopyMessage(`${label} copied!`);
		} catch (err) {
			console.error('Failed to copy:', err);
			showCopyMessage('Failed to copy');
		}
	}

	function showCopyMessage(message: string) {
		copyMessage = message;
		if (copyTimeout) clearTimeout(copyTimeout);
		copyTimeout = setTimeout(() => {
			copyMessage = '';
		}, 2000);
	}

	function clearCopyMessage() {
		copyMessage = '';
		if (copyTimeout) clearTimeout(copyTimeout);
	}

	function getSelectedStudentName(): string {
		const student = allStudentsWithTranscripts.find(s => s.id === selectedStudentId);
		return student ? `${student.fullName} (${student.nim})` : '';
	}

	function getSelectedTranscriptDate(): string {
		const transcript = availableTranscripts.find(t => t.id === selectedRecordId);
		return transcript ? new Date(transcript.createdAt).toLocaleDateString() : '';
	}

	async function handleSubmit() {
		if (!isFormValid()) {
			alert('Please fill in all required fields');
			return;
		}
		
		isSubmitting = true;
		console.log('🚀 Submitting group decrypt with:', {
			recordId: selectedRecordId,
			userShare,
			share2: { x: share2X, y: share2Y },
			share3: { x: share3X, y: share3Y }
		});
		
		try {
			const formData = new FormData();
			formData.append('recordId', selectedRecordId);
			formData.append('share1X', userShare.x);
			formData.append('share1Y', userShare.y);
			formData.append('share2X', share2X);
			formData.append('share2Y', share2Y);
			formData.append('share3X', share3X);
			formData.append('share3Y', share3Y);
			
			const response = await fetch('?/groupDecrypt', {
				method: 'POST',
				body: formData
			});
			
			if (response.ok) {
				console.log('✅ Group decryption request submitted successfully');
				// The page will reload with form data, don't set isSubmitting = false here
				// Let the reactive statement handle it when form data changes
			} else {
				isSubmitting = false;
				const errorText = await response.text();
				console.error('❌ Server error:', errorText);
				alert('Server error occurred during group decryption');
			}
		} catch (error) {
			isSubmitting = false;
			console.error('❌ Network error submitting group decrypt:', error);
			alert('Network error occurred during group decryption');
		}
	}

	function clearResults() {
		// Clear the form results to hide the display
		form = null;
	}
</script>

<BaseModal 
	bind:show 
	title="Dekripsi Grup - Rekonstruksi Kunci"
	maxWidth="max-w-6xl"
	on:close={handleClose}
>
	<div class="p-6 space-y-6">
		
		<!-- Success/Error Messages -->
		{#if form?.message}
			<div class="rounded-md bg-green-100 p-4 text-sm text-green-700 border border-green-200">
				<div class="flex items-center">
					<svg class="h-4 w-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					{form.message}
				</div>
			</div>
		{/if}
		{#if form?.error}
			<div class="rounded-md bg-red-100 p-4 text-sm text-red-700 border border-red-200">
				<div class="flex items-center">
					<svg class="h-4 w-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
					{form.error}
				</div>
			</div>
		{/if}

		<!-- Group Decrypt Results - Show FIRST if available -->
		{#if form && form.groupDecryptSuccess}
			<div class="bg-white border border-green-200 rounded-lg p-6">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-xl font-semibold text-gray-900">✅ Dekripsi Berhasil!</h3>
					<button 
						type="button"
						on:click={clearResults}
						class="text-gray-400 hover:text-gray-600"
					>
						<span class="text-xl">&times;</span>
					</button>
				</div>
				
				<!-- Verification Status -->
				<div 
					class="border-l-4 p-4 bg-gray-50 mb-4 rounded-r-md"
					class:border-green-500={form.verificationStatus === 'VERIFIED'}
					class:bg-green-50={form.verificationStatus === 'VERIFIED'}
					class:border-yellow-500={form.verificationStatus === 'UNVERIFIED'}
					class:bg-yellow-50={form.verificationStatus === 'UNVERIFIED'}
				>
					<p class="font-semibold text-lg"
					   class:text-green-700={form.verificationStatus === 'VERIFIED'}
					   class:text-yellow-700={form.verificationStatus === 'UNVERIFIED'}>
						Status: {form.verificationStatus === 'VERIFIED' ? '✅ Terverifikasi' : '⏳ Menunggu Tanda Tangan'}
					</p>
					<p class="text-sm mt-1"
					   class:text-green-600={form.verificationStatus === 'VERIFIED'}
					   class:text-yellow-600={form.verificationStatus === 'UNVERIFIED'}>
						{form.verificationMessage || 'Status tidak diketahui'}
					</p>
				</div>
				
				<!-- Student Info -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div class="bg-gray-50 p-4 rounded-lg">
						<p class="text-sm font-medium text-gray-500">Nama Mahasiswa</p>
						<p class="text-lg font-semibold text-gray-900">{form.decryptedData.name}</p>
					</div>
					<div class="bg-gray-50 p-4 rounded-lg">
						<p class="text-sm font-medium text-gray-500">NIM</p>
						<p class="text-lg font-semibold text-gray-900">{form.decryptedData.nim}</p>
					</div>
					<div class="bg-gray-50 p-4 rounded-lg">
						<p class="text-sm font-medium text-gray-500">IPK</p>
						<p class="text-lg font-semibold text-gray-900">{form.decryptedData.ipk}</p>
					</div>
				</div>
				
				<!-- Courses Table -->
				<div>
					<h4 class="text-lg font-semibold text-gray-900 mb-4">Daftar Mata Kuliah</h4>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
									<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
									<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mata Kuliah</th>
									<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SKS</th>
									<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nilai</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each form.decryptedData.courses as course, index}
									<tr class="hover:bg-gray-50">
										<td class="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
										<td class="px-4 py-3 text-sm font-medium text-gray-900">{course.code}</td>
										<td class="px-4 py-3 text-sm text-gray-900">{course.name}</td>
										<td class="px-4 py-3 text-sm text-gray-900 text-center">{course.credits}</td>
										<td class="px-4 py-3 text-sm font-semibold text-center">
											<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
												{course.grade}
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
				
				<!-- Summary Row -->
				<div class="mt-6 pt-4 border-t border-gray-200">
					<div class="flex justify-between items-center">
						<div class="text-sm text-gray-600">
							Total: {form.decryptedData.courses.length} mata kuliah
						</div>
						<div class="text-sm text-gray-600">
							Total SKS: {form?.decryptedData?.courses?.reduce((sum: number, course: { credits: number }) => sum + course.credits, 0) || 0}
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Show form only if no results to display -->
			
			<!-- Two-Step Selection -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Step 1: Select Student -->
				<div>
					<label for="studentSelect" class="block text-sm font-medium text-gray-700 mb-2">
						1. Pilih Mahasiswa
					</label>
					<select 
						id="studentSelect" 
						bind:value={selectedStudentId}
						disabled={isSubmitting}
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
					>
						<option disabled value="">-- Pilih mahasiswa --</option>
						{#each allStudentsWithTranscripts as student}
							<option value={student.id}>
								{student.fullName} ({student.nim}) - {student.records.length} transkrip
							</option>
						{/each}
					</select>
				</div>

				<!-- Step 2: Select Transcript -->
				<div>
					<label for="transcriptSelect" class="block text-sm font-medium text-gray-700 mb-2">
						2. Pilih Transkrip
					</label>
					<select 
						id="transcriptSelect" 
						bind:value={selectedRecordId}
						disabled={!selectedStudentId || availableTranscripts.length === 0 || isSubmitting}
						required 
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
					>
						<option disabled value="">-- Pilih transkrip --</option>
						{#each availableTranscripts as transcript, index}
							<option value={transcript.id}>
								Transkrip {index + 1} - {new Date(transcript.createdAt).toLocaleDateString()}
							</option>
						{/each}
					</select>
					{#if selectedStudentId && availableTranscripts.length === 0}
						<p class="mt-1 text-sm text-red-600">Mahasiswa ini belum memiliki transkrip.</p>
					{/if}
				</div>
			</div>

			<!-- Selection Summary -->
			{#if selectedStudentId && selectedRecordId}
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h4 class="text-md font-semibold text-blue-900 mb-2">Transkrip yang Dipilih:</h4>
					<p class="text-sm text-blue-800">
						<strong>Mahasiswa:</strong> {getSelectedStudentName()}<br>
						<strong>Tanggal Transkrip:</strong> {getSelectedTranscriptDate()}
					</p>
				</div>
			{/if}

			{#if selectedRecordId}
				<!-- User's Share Display with Copy Button -->
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h4 class="text-lg font-semibold text-blue-900 mb-3">Share Anda</h4>
					
					{#if isLoadingUserShare}
						<div class="flex items-center text-blue-700">
							<div class="animate-spin inline-block w-4 h-4 border-[2px] border-current border-t-transparent rounded-full mr-2"></div>
							Loading your share...
						</div>
					{:else}
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-blue-800 mb-1">X (koordinat)</label>
								<div class="flex items-center gap-2">
									<input 
										type="text" 
										value={userShare.x}
										readonly
										class="block w-full rounded-md border-gray-300 bg-gray-50 text-gray-700 text-center font-mono"
									/>
									<LoadingButton
										variant="primary"
										size="sm"
										disabled={isSubmitting}
										on:click={() => copyToClipboard(userShare.x, 'X coordinate')}
									>
										Copy
									</LoadingButton>
								</div>
							</div>
							<div>
								<label class="block text-sm font-medium text-blue-800 mb-1">Y (nilai)</label>
								<div class="flex items-center gap-2">
									<input 
										type="text" 
										value={userShare.y}
										readonly
										class="block w-full rounded-md border-gray-300 bg-gray-50 text-gray-700 font-mono text-xs"
									/>
									<LoadingButton
										variant="primary"
										size="sm"
										disabled={isSubmitting}
										on:click={() => copyToClipboard(userShare.y, 'Y value')}
									>
										Copy
									</LoadingButton>
								</div>
							</div>
						</div>
						
						<!-- Copy All Button -->
						<div class="mt-3 flex justify-center">
							<LoadingButton 
								variant="primary"
								disabled={isSubmitting}
								on:click={() => copyToClipboard(`X: ${userShare.x}, Y: ${userShare.y}`, 'Complete share')}
							>
								📋 Copy Complete Share
							</LoadingButton>
						</div>
					{/if}
				</div>

				<!-- Additional Shares Input -->
				<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
					<h4 class="text-lg font-semibold text-gray-900 mb-4">Share Tambahan (Diperlukan 2 lagi)</h4>
					
					<!-- Share 2 -->
					<div class="mb-6">
						<h5 class="text-md font-medium text-gray-800 mb-3">Share ke-2</h5>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">X</label>
								<input 
									type="number" 
									bind:value={share2X}
									required 
									min="1"
									disabled={isSubmitting}
									placeholder="contoh: 2"
									class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Y</label>
								<input 
									type="text" 
									bind:value={share2Y}
									required 
									disabled={isSubmitting}
									placeholder="Paste dari dosen lain..."
									class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-xs disabled:bg-gray-100"
								/>
							</div>
						</div>
					</div>

					<!-- Share 3 -->
					<div>
						<h5 class="text-md font-medium text-gray-800 mb-3">Share ke-3</h5>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">X</label>
								<input 
									type="number" 
									bind:value={share3X}
									required 
									min="1"
									disabled={isSubmitting}
									placeholder="contoh: 3"
									class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Y</label>
								<input 
									type="text" 
									bind:value={share3Y}
									required 
									disabled={isSubmitting}
									placeholder="Paste dari dosen lain..."
									class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-xs disabled:bg-gray-100"
								/>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/if}

		<!-- Copy Message -->
		{#if copyMessage}
			<div class="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded z-50">
				✅ {copyMessage}
			</div>
		{/if}

		<!-- Instructions -->
		<div class="bg-blue-50 border border-blue-200 rounded-md p-4">
			<div class="flex">
				<svg class="h-5 w-5 text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
				</svg>
				<div class="text-sm text-blue-800">
					<p class="font-medium">Cara Menggunakan:</p>
					<ol class="mt-1 list-decimal list-inside space-y-1">
						<li>Pilih mahasiswa dari dropdown pertama</li>
						<li>Pilih transkrip yang ingin didekripsi dari dropdown kedua</li>
						<li>Share Anda akan muncul otomatis dengan tombol copy</li>
						<li>Koordinasi dengan 2 dosen lain untuk mendapatkan share mereka</li>
						<li>Masukkan koordinat X dan nilai Y dari kedua share tambahan</li>
						<li>Klik tombol rekonstruksi untuk mendekripsi data</li>
					</ol>
				</div>
			</div>
		</div>
	</div>

	<svelte:fragment slot="footer">
		<div class="flex gap-3 justify-end">
			{#if form && form.groupDecryptSuccess}
				<!-- When showing results, offer to start over -->
				<LoadingButton 
					variant="secondary"
					on:click={clearResults}
				>
					← Kembali ke Form
				</LoadingButton>
			{:else}
				<!-- When showing form, offer decrypt action -->
				<LoadingButton 
					variant="primary"
					loading={isSubmitting}
					loadingText="Mendekripsi..."
					disabled={!isFormValid() || isSubmitting}
					on:click={handleSubmit}
				>
					Rekonstruksi & Dekripsi
				</LoadingButton>
			{/if}
			<LoadingButton 
				variant="secondary"
				on:click={resetForm}
				disabled={isSubmitting}
			>
				Reset
			</LoadingButton>
		</div>
	</svelte:fragment>
</BaseModal>