<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';

	export let showForm = false;
	export let allStudentsWithTranscripts: any[] = [];
	export let form: any = null;
	export let currentUser: any = null;

	// Two-step selection
	let selectedStudentId = '';
	let selectedRecordId = '';
	let availableTranscripts: any[] = [];

	let userShare = { x: '', y: '' }; // User's own share
	let isLoadingUserShare = false;
	
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

	function closeForm() {
		showForm = false;
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
</script>

{#if showForm}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-screen items-center justify-center p-4">
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={closeForm}></div>
			<div class="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh]">
				<form method="POST" action="?/groupDecrypt">
					<!-- Modal Header -->
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Dekripsi Grup - Pilih Mahasiswa & Transkrip</h3>
							<button type="button" class="text-gray-400 hover:text-gray-600" on:click={closeForm}>
								<span class="text-2xl">&times;</span>
							</button>
						</div>
					</div>

					<!-- Modal Content -->
					<div class="p-6 space-y-6 overflow-y-auto" style="max-height: calc(95vh - 140px);">
						
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
									class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
									name="recordId"
									bind:value={selectedRecordId}
									disabled={!selectedStudentId || availableTranscripts.length === 0}
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
												<button 
													type="button"
													on:click={() => copyToClipboard(userShare.x, 'X coordinate')}
													class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
												>
													Copy
												</button>
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
												<button 
													type="button"
													on:click={() => copyToClipboard(userShare.y, 'Y value')}
													class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
												>
													Copy
												</button>
											</div>
										</div>
									</div>
									
									<!-- Copy All Button -->
									<div class="mt-3 flex justify-center">
										<button 
											type="button"
											on:click={() => copyToClipboard(`X: ${userShare.x}, Y: ${userShare.y}`, 'Complete share')}
											class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
										>
											📋 Copy Complete Share
										</button>
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
												placeholder="contoh: 2"
												class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
											/>
										</div>
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">Y</label>
											<input 
												type="text" 
												bind:value={share2Y}
												required 
												placeholder="Paste dari dosen lain..."
												class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-xs"
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
												placeholder="contoh: 3"
												class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
											/>
										</div>
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">Y</label>
											<input 
												type="text" 
												bind:value={share3Y}
												required 
												placeholder="Paste dari dosen lain..."
												class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-xs"
											/>
										</div>
									</div>
								</div>
							</div>

							<!-- Hidden fields for form submission -->
							<input type="hidden" name="share1X" value={userShare.x} />
							<input type="hidden" name="share1Y" value={userShare.y} />
							<input type="hidden" name="share2X" bind:value={share2X} />
							<input type="hidden" name="share2Y" bind:value={share2Y} />
							<input type="hidden" name="share3X" bind:value={share3X} />
							<input type="hidden" name="share3Y" bind:value={share3Y} />
						{/if}

						<!-- Copy Message -->
						{#if copyMessage}
							<div class="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded z-50">
								✅ {copyMessage}
							</div>
						{/if}

						<!-- Group Decrypt Results -->
						{#if form && 'groupDecryptSuccess' in form && form.groupDecryptSuccess}
							<div class="border-t pt-6">
								<h3 class="text-xl font-semibold text-gray-900 mb-4">Hasil Dekripsi</h3>
								<div 
									class="border-l-4 p-4 bg-gray-50 mb-4"
									class:border-green-500={form.verificationStatus === 'VERIFIED'}
									class:bg-green-50={form.verificationStatus === 'VERIFIED'}
									class:border-yellow-500={form.verificationStatus === 'UNVERIFIED'}
									class:bg-yellow-50={form.verificationStatus === 'UNVERIFIED'}
								>
									<p class="font-semibold"
									   class:text-green-700={form.verificationStatus === 'VERIFIED'}
									   class:text-yellow-700={form.verificationStatus === 'UNVERIFIED'}>
										Status: {form.verificationStatus === 'VERIFIED' ? '✅ Verified' : '⏳ Pending Signature'}
									</p>
									<p class="text-sm mt-1 opacity-80"
									   class:text-green-600={form.verificationStatus === 'VERIFIED'}
									   class:text-yellow-600={form.verificationStatus === 'UNVERIFIED'}>
										{form.verificationMessage}
									</p>
								</div>
								
								<div class="bg-white border rounded-lg p-4">
									<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
										<div><strong>Nama:</strong> {form.decryptedData.name}</div>
										<div><strong>NIM:</strong> {form.decryptedData.nim}</div>
										<div><strong>IPK:</strong> {form.decryptedData.ipk}</div>
									</div>
									
									<div class="overflow-x-auto">
										<table class="min-w-full divide-y divide-gray-200">
											<thead class="bg-gray-50">
												<tr>
													<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
													<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mata Kuliah</th>
													<th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">SKS</th>
													<th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Nilai</th>
												</tr>
											</thead>
											<tbody class="bg-white divide-y divide-gray-200">
												{#each form.decryptedData.courses as course}
													<tr>
														<td class="px-3 py-2 text-sm">{course.code}</td>
														<td class="px-3 py-2 text-sm">{course.name}</td>
														<td class="px-3 py-2 text-sm text-center">{course.credits}</td>
														<td class="px-3 py-2 text-sm text-center font-semibold">{course.grade}</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								</div>
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

					<!-- Modal Footer -->
					<div class="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
						<div class="flex gap-4">
							<button 
								type="submit" 
								disabled={!isFormValid()}
								class="flex-1 justify-center rounded-md bg-yellow-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
							>
								Rekonstruksi & Dekripsi
							</button>
							<button 
								type="button" 
								on:click={resetForm}
								class="justify-center rounded-md bg-gray-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
							>
								Reset
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}