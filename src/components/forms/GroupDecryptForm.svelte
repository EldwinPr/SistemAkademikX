<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';
	import { onMount } from 'svelte';

	export let showForm = false;
	export let allRecords: any[] = [];
	export let form: any = null;
	export let currentUser: any = null;

	let availableAdvisors: any[] = [];
	let selectedRecordId = '';
	let userShare = '';
	
	// Auto-populated shares for all 3 advisors
	let advisor1Share = '';
	let advisor2Share = '';
	let advisor3Share = '';
	let advisor1Id = '';
	let advisor2Id = '';
	let advisor3Id = '';
	
	// Available shares for the selected record
	let recordShares: any[] = [];
	let isLoadingShares = false;

	// Set current user as advisor 1 by default
	$: if (currentUser) {
		advisor1Id = currentUser.id;
		advisor1Share = userShare;
	}

	// When record is selected, fetch all shares
	$: if (selectedRecordId) {
		fetchAllSharesForRecord(selectedRecordId);
	}

	onMount(() => {
		fetchAdvisors();
	});

	async function fetchAdvisors() {
		try {
			const response = await fetch('/api/users/advisors');
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					availableAdvisors = data.advisors;
				}
			}
		} catch (error) {
			console.error('Error fetching advisors:', error);
		}
	}

	// Fetch all shares for a record
	async function fetchAllSharesForRecord(recordId: string) {
		console.log('🔍 Fetching all shares for record:', recordId);
		isLoadingShares = true;
		
		try {
			// Get all shares for this record
			const response = await fetch(`/api/shares/all/${recordId}`);
			
			if (response.ok) {
				const data = await response.json();
				if (data.success && data.shares) {
					recordShares = data.shares;
					console.log('📦 All shares fetched:', recordShares);
					
					// Auto-populate shares
					autoPopulateShares();
				} else {
					console.log('❌ No shares found for record');
					clearAllShares();
				}
			} else {
				console.error('❌ Error fetching shares:', response.status);
				clearAllShares();
			}
		} catch (error) {
			console.error('❌ Network error fetching shares:', error);
			clearAllShares();
		} finally {
			isLoadingShares = false;
		}
	}

	// Auto-populate the three advisor shares
	function autoPopulateShares() {
		// Find current user's share
		const currentUserShare = recordShares.find(share => share.advisorId === currentUser?.id);
		if (currentUserShare) {
			advisor1Id = currentUser.id;
			advisor1Share = currentUserShare.shareY;
			userShare = currentUserShare.shareY; // Keep this for backward compatibility
		}

		// Auto-select other advisors (exclude current user)
		const otherShares = recordShares.filter(share => share.advisorId !== currentUser?.id);
		
		if (otherShares.length >= 1) {
			advisor2Id = otherShares[0].advisorId;
			advisor2Share = otherShares[0].shareY;
		}
		
		if (otherShares.length >= 2) {
			advisor3Id = otherShares[1].advisorId;
			advisor3Share = otherShares[1].shareY;
		}

		console.log('✅ Auto-populated shares:', {
			advisor1: { id: advisor1Id, share: advisor1Share },
			advisor2: { id: advisor2Id, share: advisor2Share },
			advisor3: { id: advisor3Id, share: advisor3Share }
		});
	}

	function clearAllShares() {
		advisor1Share = '';
		advisor2Share = '';
		advisor3Share = '';
		advisor2Id = '';
		advisor3Id = '';
		recordShares = [];
	}

	// When advisor selection changes, update the share
	function onAdvisorChange(advisorNumber: number, advisorId: string) {
		const share = recordShares.find(s => s.advisorId === advisorId);
		
		if (advisorNumber === 2) {
			advisor2Share = share ? share.shareY : '';
		} else if (advisorNumber === 3) {
			advisor3Share = share ? share.shareY : '';
		}
	}

	function closeForm() {
		showForm = false;
		clearAllShares();
		selectedRecordId = '';
	}

	// Legacy function - keep for current user share
	async function fetchUserShare(recordId: string) {
		try {
			const response = await fetch(`/api/shares/${recordId}`);
			if (response.ok) {
				const data = await response.json();
				userShare = data.share?.shareY || '';
			}
		} catch (error) {
			console.error('Failed to fetch user share:', error);
		}
	}
</script>

{#if showForm}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-screen items-center justify-center p-4">
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={closeForm}></div>
								<div class="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh]">
				<form method="POST" action="?/groupDecrypt">
					<!-- Modal Header -->
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Dekripsi Grup</h3>
							<button type="button" class="text-gray-400 hover:text-gray-600" on:click={closeForm}>
								<span class="text-2xl">&times;</span>
							</button>
						</div>
					</div>

					<!-- Modal Content -->
					<div class="p-6 space-y-6 overflow-y-auto" style="max-height: calc(90vh - 140px);">
						<!-- Record Selection -->
						<div>
							<label for="recordId" class="block text-sm font-medium text-gray-700">
								Pilih Transkrip Mahasiswa
							</label>
							<select 
								id="recordId" 
								name="recordId" 
								required 
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							>
								<option disabled selected value="">-- Pilih record yang akan dibuka --</option>
								{#each allRecords as record}
									<option value={record.id}>
										{record.student.nim} - {record.student.fullName}
									</option>
								{/each}
							</select>
						</div>

						<!-- Advisor Shares Input -->
						<div>
							<h3 class="text-lg font-medium text-gray-800">Masukkan 3 Bagian Kunci</h3>
							
							{#if isLoadingShares}
								<div class="mt-4 text-center text-gray-600">
									<div class="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full"></div>
									Loading shares...
								</div>
							{:else}
								<div class="mt-4 space-y-4">
									
									<!-- Share 1: Current User -->
									<div class="bg-blue-50 border border-blue-200 rounded-md p-4">
										<label class="block text-sm font-medium text-blue-800 mb-2">
											Bagian Kunci Anda ({currentUser?.fullName || 'Current User'})
										</label>
										<input 
											type="text" 
											name="shareY1" 
											bind:value={advisor1Share}
											required 
											placeholder="Bagian kunci Anda akan ditampilkan di sini" 
											class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-xs bg-white"
											readonly
										/>
										<input type="hidden" name="advisorId1" bind:value={advisor1Id} />
									</div>

									<!-- Share 2 -->
									<div class="bg-green-50 border border-green-200 rounded-md p-4">
										<label class="block text-sm font-medium text-green-800 mb-2">
											Bagian Kunci dari Dosen ke-2
										</label>
										<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
											<select 
												name="advisorId2" 
												bind:value={advisor2Id}
												on:change={() => onAdvisorChange(2, advisor2Id)}
												required 
												class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
											>
												<option disabled value="">-- Auto-selected --</option>
												{#each availableAdvisors as advisor}
													{#if advisor.id !== currentUser?.id}
														<option value={advisor.id}>{advisor.fullName}</option>
													{/if}
												{/each}
											</select>
											<input 
												type="text" 
												name="shareY2" 
												bind:value={advisor2Share}
												required 
												placeholder="Auto-filled when advisor selected" 
												class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-xs"
												readonly
											/>
										</div>
									</div>

									<!-- Share 3 -->
									<div class="bg-purple-50 border border-purple-200 rounded-md p-4">
										<label class="block text-sm font-medium text-purple-800 mb-2">
											Bagian Kunci dari Dosen ke-3
										</label>
										<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
											<select 
												name="advisorId3" 
												bind:value={advisor3Id}
												on:change={() => onAdvisorChange(3, advisor3Id)}
												required 
												class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
											>
												<option disabled value="">-- Auto-selected --</option>
												{#each availableAdvisors as advisor}
													{#if advisor.id !== currentUser?.id}
														<option value={advisor.id}>{advisor.fullName}</option>
													{/if}
												{/each}
											</select>
											<input 
												type="text" 
												name="shareY3" 
												bind:value={advisor3Share}
												required 
												placeholder="Auto-filled when advisor selected" 
												class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-xs"
												readonly
											/>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<!-- Group Decrypt Results -->
						{#if form && 'groupDecryptSuccess' in form && form.groupDecryptSuccess}
							<div class="border-t pt-6">
								<h3 class="text-xl font-semibold text-gray-900">Hasil Dekripsi</h3>
								<div 
									class="mt-4 border-l-4 p-4 bg-gray-50"
									class:border-green-500={form.verificationStatus === VerificationStatus.VERIFIED}
									class:border-red-500={form.verificationStatus !== VerificationStatus.VERIFIED}
								>
									<p>
										Status: 
										<span 
											class="font-bold"
											class:text-green-700={form.verificationStatus === VerificationStatus.VERIFIED}
											class:text-red-700={form.verificationStatus !== VerificationStatus.VERIFIED}
										>
											{form.verificationStatus}
										</span> 
										- ({form.verificationMessage})
									</p>
								</div>
								
								<div class="mt-4 text-sm">
									<p><strong>Nama:</strong> {form.decryptedData.name}</p>
									<p><strong>NIM:</strong> {form.decryptedData.nim}</p>
									<p><strong>IPK:</strong> {form.decryptedData.ipk}</p>
									
									<table class="min-w-full divide-y divide-gray-200 mt-4">
										<thead class="bg-gray-100">
											<tr>
												<th class="px-2 py-1">Kode</th>
												<th class="px-2 py-1">Mata Kuliah</th>
												<th class="px-2 py-1">SKS</th>
												<th class="px-2 py-1">Nilai</th>
											</tr>
										</thead>
										<tbody>
											{#each form.decryptedData.courses as course}
												<tr class="border-b">
													<td class="px-2 py-1">{course.code}</td>
													<td class="px-2 py-1">{course.name}</td>
													<td class="px-2 py-1">{course.credits}</td>
													<td class="px-2 py-1">{course.grade}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						{/if}
					</div>

					<!-- Modal Footer -->
					<div class="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
						<button 
							type="submit" 
							class="w-full rounded-md bg-yellow-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700"
						>
							Rekonstruksi & Dekripsi
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}