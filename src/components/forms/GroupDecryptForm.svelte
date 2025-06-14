<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';
	import { onMount } from 'svelte';

	export let showForm = false;
	export let allRecords: any[] = [];
	//export let allAdvisors: any[] = [];
	export let form: any = null;
	export let currentUser: any = null; // Pass current user from parent

	let availableAdvisors: any[] = [];

	let selectedRecordId = '';
	let userShare = '';

	$: if (selectedRecordId) {
		fetchUserShare(selectedRecordId);
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
            } else {
                console.error('Failed to fetch advisors list');
            }
        } catch (error) {
            console.error('Error fetching advisors:', error);
        }
    }

	async function fetchUserShare(recordId: string) {
		try {
			const response = await fetch(`/api/shares/${recordId}`);
			if (response.ok) {
				const data = await response.json();
				userShare = data.shareY || '';
			}
		} catch (error) {
			console.error('Failed to fetch share:', error);
		}
	}

	function closeForm() {
		showForm = false;
	}

	let shares = ['', '', ''];
	let shareErrors = ['', '', ''];

	function validateShareFormat(shareValue: string): string {
		if (!shareValue) {
			return 'Share cannot be empty.';
		}

		if (!/^[a-fA-F0-9]+$/.test(shareValue)) {
			return 'Invalid format. Share must be a hexadecimal string.';
		}
		if (shareValue.length < 32) { // Asumsi panjang minimal
			return 'Share seems too short.';
		}
		return ''; 
	}

	function handleShareInput(index: number) {
		shareErrors[index] = validateShareFormat(shares[index]);
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
							<div class="mt-4 space-y-4">
								
								<!-- Share 1: Current User -->
								<div class="bg-blue-50 border border-blue-200 rounded-md p-4">
									<label class="block text-sm font-medium text-blue-800 mb-2">
										Bagian Kunci Anda ({currentUser?.fullName || 'Current User'})
									</label>
									<input 
										type="text" 
										name="shareY1" 
										bind:value={userShare}
										required 
										placeholder="Bagian kunci Anda akan ditampilkan di sini" 
										class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-xs bg-white"
									/>
									<!-- Hidden input for current user -->
									<input type="hidden" name="advisorId1" value={currentUser?.id} />
								</div>

								<!-- Share 2 -->
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										Bagian Kunci dari Dosen ke-2
									</label>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<select 
											name="advisorId2" 
											required 
											class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
										>
											<option disabled selected value="">-- Pilih Dosen Wali ke-2 --</option>
											{#each availableAdvisors as advisor}
												{#if advisor.id !== currentUser?.id}
													<option value={advisor.id}>{advisor.fullName}</option>
												{/if}
											{/each}
										</select>
										<input 
											type="text" 
											name="shareY2" 
											required 
											placeholder="Bagian kunci dari Dosen ke-2" 
											class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-xs"
										/>
									</div>
								</div>

								<!-- Share 3 -->
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										Bagian Kunci dari Dosen ke-3
									</label>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<select 
											name="advisorId3" 
											required 
											class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
										>
											<option disabled selected value="">-- Pilih Dosen Wali ke-3 --</option>
											{#each availableAdvisors as advisor}
												{#if advisor.id !== currentUser?.id}
													<option value={advisor.id}>{advisor.fullName}</option>
												{/if}
											{/each}
										</select>
										<input 
											type="text" 
											name="shareY3" 
											required 
											placeholder="Bagian kunci dari Dosen ke-3" 
											class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-xs"
										/>
									</div>
								</div>
							</div>

							<!-- Simple Info Box -->
							<div class="mt-4 bg-gray-50 border border-gray-200 rounded-md p-3">
								<p class="text-sm text-gray-600">
									<strong>Catatan:</strong> Koordinasi dengan 2 dosen wali lainnya untuk mendapatkan bagian kunci mereka.
								</p>
							</div>
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