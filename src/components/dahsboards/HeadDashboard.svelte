<script lang="ts">
	import { VerificationStatus } from '$lib/types/academic.types';

	export let data: any;
	export let form: any;

	$: user = data.userContext.user;
	$: programRecords = data.programRecords || [];

	// View states
	let showAllTranscriptsView = false;
	let showSigningView = false;
	interface RecordDetails {
		verificationStatus: VerificationStatus;
		verificationMessage: string;
		name: string;
		nim: string;
		ipk: number;
		courses: Array<{
			code: string;
			name: string;
			credits: number;
			grade: string;
		}>;
	}

	let viewedRecordDetails: RecordDetails | null = null;

	// Handle view record response
	$: if (form && 'viewSuccess' in form && form.viewSuccess) {
		viewedRecordDetails = form.viewedRecord;
	}

	function translateProgram(program: string): string {
		switch (program) {
			case 'Teknik_Informatika': return 'Teknik Informatika';
			case 'Sistem_Teknologi_Informasi': return 'Sistem dan Teknologi Informasi';
			default: return program;
		}
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

	<!-- All Transcripts View -->
	{#if showAllTranscriptsView}
		<div class="bg-white p-8 shadow-lg rounded-lg">
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-2xl font-bold text-gray-800">Daftar Transkrip Program Studi</h2>
				<button 
					type="button" 
					on:click={() => {showAllTranscriptsView = false; viewedRecordDetails = null;}} 
					class="text-gray-500 hover:text-gray-800 text-2xl font-bold"
				>
					&times;
				</button>
			</div>
			
			<div class="grid md:grid-cols-2 gap-8">
				<!-- Record List -->
				<div class="border-r-0 md:border-r pr-0 md:pr-8">
					<h3 class="font-semibold text-lg">Pilih Record</h3>
					<ul class="mt-4 space-y-2 max-h-96 overflow-y-auto">
						{#each programRecords as record}
							<li>
								<form method="POST" action="?/viewRecord">
									<input type="hidden" name="recordId" value={record.id} />
									<button type="submit" class="text-left w-full p-3 rounded-md hover:bg-gray-100">
										<p class="font-medium">{record.student.fullName}</p>
										<p class="text-sm text-gray-500">
											{record.student.nim} - Dibuat: {new Date(record.createdAt).toLocaleDateString()}
										</p>
									</button>
								</form>
							</li>
						{:else}
							<p class="text-sm text-gray-500">Belum ada data transkrip di program studi ini.</p>
						{/each}
					</ul>
				</div>
				
				<!-- Record Details -->
				<div>
					<h3 class="font-semibold text-lg">Detail Transkrip</h3>
					{#if viewedRecordDetails}
						<div class="mt-4 space-y-2">
							<div 
								class="border-l-4 p-4 bg-gray-50"
								class:border-green-500={viewedRecordDetails.verificationStatus === VerificationStatus.VERIFIED}
								class:border-red-500={viewedRecordDetails.verificationStatus !== VerificationStatus.VERIFIED}
							>
								<p>
									Status: <span class="font-bold">{viewedRecordDetails.verificationStatus}</span> 
									- ({viewedRecordDetails.verificationMessage})
								</p>
							</div>
							<p><strong>Nama:</strong> {viewedRecordDetails.name}</p>
							<p><strong>NIM:</strong> {viewedRecordDetails.nim}</p>
							<p><strong>IPK:</strong> {viewedRecordDetails.ipk}</p>
							
							<h4 class="font-medium pt-2 border-t mt-2">Mata Kuliah:</h4>
							<div class="text-xs">
								{#each viewedRecordDetails.courses as course}
									<p>{course.code} - {course.name} ({course.credits} SKS) - Nilai: {course.grade}</p>
								{/each}
							</div>
						</div>
					{:else}
						<div class="mt-4 text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
							Pilih record dari daftar di sebelah kiri untuk melihat detailnya.
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Digital Signing View -->
	{#if showSigningView}
		<div class="bg-white p-8 shadow-lg rounded-lg">
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-2xl font-bold text-gray-800">Tanda Tangan Digital Transkrip</h2>
				<button 
					type="button" 
					on:click={() => showSigningView = false} 
					class="text-gray-500 hover:text-gray-800 text-2xl font-bold"
				>
					&times;
				</button>
			</div>
			
			<table class="min-w-full">
				<thead>
					<tr>
						<th class="text-left py-2">Mahasiswa</th>
						<th class="text-left py-2">Status TTD</th>
						<th class="text-right py-2">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each programRecords as record}
						<tr class="border-b">
							<td class="py-2">{record.student.fullName} ({record.student.nim})</td>
							<td class="py-2">
								{#if record.digitalSignature}
									<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
										Sudah Ditandatangani
									</span>
								{:else}
									<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
										Belum Ditandatangani
									</span>
								{/if}
							</td>
							<td class="py-2 text-right">
								<form method="POST" action="?/signRecord">
									<input type="hidden" name="recordId" value={record.id} />
									<button 
										type="submit" 
										class="text-sm font-medium text-indigo-600 hover:text-indigo-900"
									>
										Tanda Tangani Ulang
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
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
				<div class="overflow-hidden rounded-lg bg-purple-50 p-5 shadow">
					<h4 class="text-lg font-medium text-purple-900">Lihat Semua Data</h4>
					<p class="mt-1 text-sm text-purple-800">
						Akses seluruh transkrip program studi
					</p>
					<button 
						type="button" 
						on:click={() => (showAllTranscriptsView = true)} 
						class="mt-4 font-semibold text-purple-600 hover:text-purple-800"
					>
						Akses Data &rarr;
					</button>
				</div>

				<!-- Digital Signing -->
				<div class="overflow-hidden rounded-lg bg-red-50 p-5 shadow">
					<h4 class="text-lg font-medium text-red-900">Tanda Tangan Digital</h4>
					<p class="mt-1 text-sm text-red-800">
						Tanda tangani data akademik secara digital
					</p>
					<button 
						type="button" 
						on:click={() => (showSigningView = true)} 
						class="mt-4 font-semibold text-red-600 hover:text-red-800"
					>
						Buka Menu &rarr;
					</button>
				</div>

				<!-- Generate PDF -->
				<div class="overflow-hidden rounded-lg bg-green-50 p-5 shadow">
					<h4 class="text-lg font-medium text-green-900">Cetak PDF</h4>
					<p class="mt-1 text-sm text-green-800">
						Generate transkrip dalam format PDF
					</p>
					<a 
						href="/dashboard/pdf" 
						class="mt-4 inline-block font-semibold text-green-600 hover:text-green-800"
					>
						Generate PDF &rarr;
					</a>
				</div>

				<!-- Key Management -->
				<div class="overflow-hidden rounded-lg bg-blue-50 p-5 shadow">
					<h4 class="text-lg font-medium text-blue-900">Kelola Kunci</h4>
					<p class="mt-1 text-sm text-blue-800">
						Administrasi kunci enkripsi dan akses
					</p>
					<a 
						href="/dashboard/keys" 
						class="mt-4 inline-block font-semibold text-blue-600 hover:text-blue-800"
					>
						Kelola &rarr;
					</a>
				</div>

				<!-- Reports -->
				<div class="overflow-hidden rounded-lg bg-yellow-50 p-5 shadow">
					<h4 class="text-lg font-medium text-yellow-900">Laporan</h4>
					<p class="mt-1 text-sm text-yellow-800">
						Lihat statistik dan laporan program studi
					</p>
					<a 
						href="/dashboard/reports" 
						class="mt-4 inline-block font-semibold text-yellow-600 hover:text-yellow-800"
					>
						Lihat Laporan &rarr;
					</a>
				</div>

				<!-- Settings -->
				<div class="overflow-hidden rounded-lg bg-gray-50 p-5 shadow">
					<h4 class="text-lg font-medium text-gray-900">Pengaturan</h4>
					<p class="mt-1 text-sm text-gray-800">
						Konfigurasi sistem dan preferensi
					</p>
					<a 
						href="/dashboard/settings" 
						class="mt-4 inline-block font-semibold text-gray-600 hover:text-gray-800"
					>
						Pengaturan &rarr;
					</a>
				</div>

			</div>
		</div>
	</div>
</div>