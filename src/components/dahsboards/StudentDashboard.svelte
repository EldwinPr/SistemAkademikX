<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';

	export let data: any;
	export let form: any;

	$: user = data.userContext.user;

	// Show transcript if form action succeeded
	$: showTranscript = form && 'myTranscriptSuccess' in form && form.myTranscriptSuccess;
	$: transcript = form?.myTranscript;
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

	<!-- My Transcript View -->
	{#if showTranscript}
		<div class="bg-white p-8 shadow-lg rounded-lg">
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-2xl font-bold text-gray-800">Transkrip Akademik Anda</h2>
				<a href="/dashboard" class="text-gray-500 hover:text-gray-800" aria-label="Tutup">
					&times; Tutup
				</a>
			</div>
			
			<!-- Verification Status -->
			<div 
				class="border-l-4 p-4 bg-gray-50 mb-4"
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
						{transcript.verificationStatus}
					</span>
					({transcript.verificationMessage})
				</p>
			</div>

			<!-- Student Info -->
			<div class="mt-4 text-sm space-y-2">
				<p><strong>Nama:</strong> {transcript.name}</p>
				<p><strong>NIM:</strong> {transcript.nim}</p>
				<p><strong>IPK:</strong> {transcript.ipk}</p>
				
				<!-- Courses Table -->
				<h4 class="font-medium pt-2 border-t mt-2">Daftar Mata Kuliah:</h4>
				<table class="min-w-full divide-y divide-gray-200 mt-2 text-center">
					<thead class="bg-gray-100">
						<tr>
							<th class="px-2 py-1">Kode</th>
							<th class="px-2 py-1">Mata Kuliah</th>
							<th class="px-2 py-1">SKS</th>
							<th class="px-2 py-1">Nilai</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each transcript.courses as course}
							<tr>
								<td class="px-2 py-1">{course.code}</td>
								<td class="px-2 py-1 text-left">{course.name}</td>
								<td class="px-2 py-1">{course.credits}</td>
								<td class="px-2 py-1">{course.grade}</td>
							</tr>
						{/each}
					</tbody>
				</table>
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

				<!-- Download PDF -->
				<div class="overflow-hidden rounded-lg bg-green-50 p-5 shadow">
					<h4 class="text-lg font-medium text-green-900">Unduh PDF</h4>
					<p class="mt-1 text-sm text-green-800">
						Download transkrip dalam format PDF
					</p>
					<a 
						href="/dashboard/pdf" 
						class="mt-4 inline-block font-semibold text-green-600 hover:text-green-800"
					>
						Generate PDF &rarr;
					</a>
				</div>

			</div>
		</div>
	</div>
</div>