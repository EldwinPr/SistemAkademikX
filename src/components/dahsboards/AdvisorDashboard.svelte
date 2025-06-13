<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';
	import TranscriptInputForm from '../forms/TranscriptInputForm.svelte';

	export let data: any;
	export let form: any;

	$: user = data.userContext.user;
	$: students = data.students || [];
	$: allAdvisors = data.allAdvisors || [];
	$: adviseeRecords = data.adviseeRecords || [];

	// Form visibility states
	let showInputForm = false;
	let showGroupDecryptForm = false;

	// Close input form on success
	$: if (form && 'success' in form && form.success) {
		showInputForm = false;
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

	<!-- Transcript Input Form -->
	<TranscriptInputForm {students} bind:showForm={showInputForm} />

	<!-- Group Decrypt Form -->
	{#if showGroupDecryptForm}
		<form method="POST" action="?/groupDecrypt" class="space-y-6 bg-white p-8 shadow-lg rounded-lg">
			<div class="flex justify-between items-center">
				<h2 class="text-2xl font-bold text-gray-800">Dekripsi Grup</h2>
				<button 
					type="button" 
					on:click={() => (showGroupDecryptForm = false)} 
					class="text-gray-500 hover:text-gray-800 text-2xl font-bold"
				>
					&times;
				</button>
			</div>

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
					{#each adviseeRecords as record}
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
					{#each [1, 2, 3] as i}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<select 
								name="advisorId{i}" 
								required 
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							>
								<option disabled selected value="">-- Pilih Dosen Wali ke-{i} --</option>
								{#each allAdvisors as advisor}
									<option value={advisor.id}>{advisor.fullName}</option>
								{/each}
							</select>
							<input 
								type="text" 
								name="shareY{i}" 
								required 
								placeholder="Bagian kunci dari Dosen ke-{i}" 
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							/>
						</div>
					{/each}
				</div>
			</div>

			<button 
				type="submit" 
				class="w-full rounded-md bg-yellow-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700"
			>
				Rekonstruksi & Dekripsi
			</button>

			<!-- Group Decrypt Results -->
			{#if form && 'groupDecryptSuccess' in form && form.groupDecryptSuccess}
				<div class="mt-6 border-t pt-6">
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
		</form>
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
				<div class="overflow-hidden rounded-lg bg-blue-50 p-5 shadow">
					<h4 class="text-lg font-medium text-blue-900">Input Data Mahasiswa</h4>
					<p class="mt-1 text-sm text-blue-800">
						Masukkan data nilai mahasiswa bimbingan
					</p>
					<button 
						type="button" 
						on:click={() => (showInputForm = true)} 
						class="mt-4 font-semibold text-blue-600 hover:text-blue-800"
					>
						Mulai Input &rarr;
					</button>
				</div>

				<!-- Group Decrypt -->
				<div class="overflow-hidden rounded-lg bg-yellow-50 p-5 shadow">
					<h4 class="text-lg font-medium text-yellow-900">Dekripsi Grup</h4>
					<p class="mt-1 text-sm text-yellow-800">
						Buka data transkrip bersama dosen lain
					</p>
					<button 
						type="button" 
						on:click={() => (showGroupDecryptForm = true)} 
						class="mt-4 font-semibold text-yellow-600 hover:text-yellow-800"
					>
						Mulai Proses &rarr;
					</button>
				</div>

				<!-- View My Students -->
				<div class="overflow-hidden rounded-lg bg-green-50 p-5 shadow">
					<h4 class="text-lg font-medium text-green-900">Mahasiswa Bimbingan</h4>
					<p class="mt-1 text-sm text-green-800">
						Lihat daftar dan transkrip mahasiswa bimbingan
					</p>
					<a 
						href="/dashboard/students" 
						class="mt-4 inline-block font-semibold text-green-600 hover:text-green-800"
					>
						Lihat Daftar &rarr;
					</a>
				</div>

				<!-- Generate PDF -->
				<div class="overflow-hidden rounded-lg bg-purple-50 p-5 shadow">
					<h4 class="text-lg font-medium text-purple-900">Cetak PDF</h4>
					<p class="mt-1 text-sm text-purple-800">
						Generate transkrip dalam format PDF
					</p>
					<a 
						href="/dashboard/pdf" 
						class="mt-4 inline-block font-semibold text-purple-600 hover:text-purple-800"
					>
						Generate PDF &rarr;
					</a>
				</div>

			</div>
		</div>
	</div>
</div>