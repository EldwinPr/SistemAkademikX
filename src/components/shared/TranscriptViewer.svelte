<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';

	export let transcript: any;
	export let showTitle = true;
	export let allowClose = false;
	export let onClose: (() => void) | null = null;

	function getVerificationDisplay(transcript: any) {
		const status = transcript.verificationStatus;
		const message = transcript.verificationMessage || '';
		
		if (status === 'VERIFIED' || status === VerificationStatus.VERIFIED) {
			return {
				icon: '✅',
				text: 'Verified',
				color: 'green',
				description: 'This transcript has been digitally signed and verified by the Head of Study Program.',
				details: 'All data has been cryptographically secured and authenticated.'
			};
		}
		
		// Check if it's unsigned vs invalid
		if (message.includes('not been signed yet') || message.includes('Not signed')) {
			return {
				icon: '⏳',
				text: 'Pending Signature',
				color: 'yellow',
				description: 'This transcript is awaiting digital signature approval from the Head of Study Program.',
				details: 'The academic data has been recorded and encrypted, but requires official approval before it can be considered final.'
			};
		}
		
		// Invalid or corrupted signature
		return {
			icon: '❌',
			text: 'Unverified',
			color: 'red',
			description: 'Digital signature verification failed - this transcript may have been tampered with.',
			details: 'Please contact your academic administrator to resolve this issue.'
		};
	}

	$: verificationDisplay = getVerificationDisplay(transcript);

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
	
	<!-- Improved Verification Status Display -->
	<div 
		class="border-l-4 p-4 bg-gray-50 mb-6 rounded-r-md"
		class:border-green-500={verificationDisplay.color === 'green'}
		class:bg-green-50={verificationDisplay.color === 'green'}
		class:border-yellow-500={verificationDisplay.color === 'yellow'}
		class:bg-yellow-50={verificationDisplay.color === 'yellow'}
		class:border-red-500={verificationDisplay.color === 'red'}
		class:bg-red-50={verificationDisplay.color === 'red'}
	>
		<div class="flex items-start">
			<span class="text-xl mr-3 mt-0.5">{verificationDisplay.icon}</span>
			<div class="flex-1">
				<p class="font-semibold text-lg mb-1" 
				   class:text-green-700={verificationDisplay.color === 'green'}
				   class:text-yellow-700={verificationDisplay.color === 'yellow'}
				   class:text-red-700={verificationDisplay.color === 'red'}>
					Status: {verificationDisplay.text}
				</p>
				<p class="text-sm mb-2"
				   class:text-green-600={verificationDisplay.color === 'green'}
				   class:text-yellow-600={verificationDisplay.color === 'yellow'}
				   class:text-red-600={verificationDisplay.color === 'red'}>
					{verificationDisplay.description}
				</p>
				<p class="text-xs opacity-80"
				   class:text-green-600={verificationDisplay.color === 'green'}
				   class:text-yellow-600={verificationDisplay.color === 'yellow'}
				   class:text-red-600={verificationDisplay.color === 'red'}>
					{verificationDisplay.details}
				</p>
			</div>
		</div>
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
					{#each transcript.courses as course, index}
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
				Total: {transcript.courses.length} mata kuliah
			</div>
			<div class="text-sm text-gray-600">
				Total SKS: {transcript.courses.reduce((sum: number, course: { credits: number }) => sum + course.credits, 0)}
			</div>
		</div>
	</div>
</div>