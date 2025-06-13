<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';

	export let transcript: any;
	export let showTitle = true;
	export let allowClose = false;
	export let onClose: (() => void) | null = null;

	function handleClose() {
		if (onClose) {
			onClose();
		}
	}
</script>

<div class="bg-white p-6 shadow-lg rounded-lg">
	{#if showTitle}
		<div class="flex justify-between items-center mb-6">
			<h3 class="text-xl font-bold text-gray-800">Detail Transkrip Akademik</h3>
			{#if allowClose && onClose}
				<button 
					type="button" 
					on:click={handleClose}
					class="text-gray-500 hover:text-gray-800 text-xl font-bold"
				>
					&times;
				</button>
			{/if}
		</div>
	{/if}
	
	<!-- Verification Status -->
	<div 
		class="border-l-4 p-4 bg-gray-50 mb-6"
		class:border-green-500={transcript.verificationStatus === VerificationStatus.VERIFIED}
		class:border-red-500={transcript.verificationStatus !== VerificationStatus.VERIFIED}
	>
		<p>
			Status Tanda Tangan: 
			<span 
				class="font-bold"
				class:text-green-700={transcript.verificationStatus === VerificationStatus.VERIFIED}
				class:text-red-700={transcript.verificationStatus !== VerificationStatus.VERIFIED}
			>
				{transcript.verificationStatus === VerificationStatus.VERIFIED ? '✅ Verified' : '❌ Unverified'}
			</span>
			({transcript.verificationMessage})
		</p>
	</div>

	<!-- Student Information -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
		<div class="bg-gray-50 p-4 rounded-lg">
			<p class="text-sm font-medium text-gray-500">Nama Mahasiswa</p>
			<p class="text-lg font-semibold text-gray-900">{transcript.name}</p>
		</div>
		<div class="bg-gray-50 p-4 rounded-lg">
			<p class="text-sm font-medium text-gray-500">NIM</p>
			<p class="text-lg font-semibold text-gray-900">{transcript.nim}</p>
		</div>
		<div class="bg-gray-50 p-4 rounded-lg">
			<p class="text-sm font-medium text-gray-500">IPK</p>
			<p class="text-lg font-semibold text-gray-900">{transcript.ipk}</p>
		</div>
	</div>
	
	<!-- Courses Table -->
	<div>
		<h4 class="text-lg font-semibold text-gray-900 mb-4">Daftar Mata Kuliah</h4>
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mata Kuliah</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKS</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nilai</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each transcript.courses as course, index}
					<tr>
						<td class="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
						<td class="px-4 py-3 text-sm font-medium text-gray-900">{course.code}</td>
						<td class="px-4 py-3 text-sm text-gray-900">{course.name}</td>
						<td class="px-4 py-3 text-sm text-gray-900 text-center">{course.credits}</td>
						<td class="px-4 py-3 text-sm font-semibold text-center">{course.grade}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>