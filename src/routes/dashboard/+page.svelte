<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { VerificationStatus } from '$lib/types/academic.types';
	import { RC4Utils } from '$lib/cryptography/RC4';

	export let data: PageData;
	export let form: ActionData;

	let showInputForm = false;
	let showGroupDecryptForm = false;
	let showAllTranscriptsView = false;
	let showSigningView = false;
	let showPdfView = false;
	let viewedRecordDetails: any = null;
	let showMyTranscriptView = false; 

	$: user = data.userContext.user;
	$: students = data.students;
	$: allRecords = data.allRecords;
	$: allAdvisors = data.allAdvisors;
	$: programRecords = data.programRecords;

	function translateRole(role: string): string {
		switch (role) {
			case 'Mahasiswa': return 'Mahasiswa';
			case 'Dosen_Wali': return 'Dosen Wali';
			case 'Kepala_Program_Studi': return 'Kepala Program Studi';
			default: return role;
		}
	}

	let courses = Array(10).fill(null).map(() => ({ code: '', name: '', credits: 0, grade: 'A' }));
	let ipk = 0.0;
	const gradePoints: { [key: string]: number } = { A: 4.0, AB: 3.5, B: 3.0, BC: 2.5, C: 2.0, D: 1.0, E: 0.0 };
	const gradeOptions = Object.keys(gradePoints);

	function calculateIPK() {
		let totalPoints = 0;
		let totalCredits = 0;
		for (const course of courses) {
			if (course.credits > 0 && gradePoints[course.grade] !== undefined) {
				totalPoints += gradePoints[course.grade] * course.credits;
				totalCredits += Number(course.credits);
			}
		}
		ipk = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0.0;
	}
	$: if (courses) calculateIPK();

	$: if (form && 'success' in form && form.success) {
		showInputForm = false;
	}
	$: if (form && 'viewSuccess' in form && form.viewSuccess) {
		viewedRecordDetails = form.viewedRecord;
	}
	$: if (form && 'myTranscriptSuccess' in form && form.myTranscriptSuccess) {
		showMyTranscriptView = true;
	}

	let encryptedPdfFile: FileList | null = null;
	let decryptionKey = '';
	let decryptedPdfContent = '';
	let decryptPdfError = '';

	async function handleDecryptPdf() {
		if (!encryptedPdfFile || encryptedPdfFile.length === 0) {
			decryptPdfError = 'Silakan pilih file PDF terenkripsi.';
			return;
		}
		if (!decryptionKey) {
			decryptPdfError = 'Silakan masukkan kunci dekripsi.';
			return;
		}
		decryptPdfError = '';
		decryptedPdfContent = '';
		try {
			const file = encryptedPdfFile[0];
			const buffer = await file.arrayBuffer();
			const encryptedData = new Uint8Array(buffer);
			const decryptedData = RC4Utils.decryptBinary(encryptedData, decryptionKey);
			decryptedPdfContent = new TextDecoder().decode(decryptedData);
		} catch (e: any) {
			decryptPdfError = 'Gagal mendekripsi file. Pastikan kunci benar. Error: ' + e.message;
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Sistem Akademik X</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
	<div class="mx-auto max-w-7xl">
		<header class="flex items-center justify-between border-b border-gray-200 pb-6">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-gray-900">Sistem Akademik X</h1>
				<p class="mt-1 text-lg text-gray-600">Dashboard</p>
			</div>
			<a href="/api/auth/logout" class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Logout</a>
		</header>

		<main class="mt-8">
			{#if form?.message}
				<div class="mb-4 rounded-md bg-green-100 p-4 text-sm text-green-700">{form.message}</div>
			{/if}
			{#if form?.error}
				<div class="mb-4 rounded-md bg-red-100 p-4 text-sm text-red-700">{form.error}</div>
			{/if}

			{#if form && 'myTranscriptSuccess' in form && form.myTranscript}
				{@const transcript = form.myTranscript}
				<div class="bg-white p-8 shadow-lg sm:rounded-lg mb-8">
					<div class="flex justify-between items-center mb-6">
						<h2 class="text-2xl font-bold text-gray-800">Transkrip Akademik Anda</h2>
						<a href="/dashboard" class="text-gray-500 hover:text-gray-800" aria-label="Tutup">&times; Tutup</a>
					</div>
					<div class:border-green-500={transcript.verificationStatus === VerificationStatus.VERIFIED} class:border-red-500={transcript.verificationStatus !== VerificationStatus.VERIFIED} class="border-l-4 p-4 bg-gray-50 mb-4">
						<p>Status Tanda Tangan: 
							<span class:text-green-700={transcript.verificationStatus === VerificationStatus.VERIFIED} class:text-red-700={transcript.verificationStatus !== VerificationStatus.VERIFIED} class="font-bold">{transcript.verificationStatus}</span>
							({transcript.verificationMessage})
						</p>
					</div>
					<div class="mt-4 text-sm space-y-2">
						<p><strong>Nama:</strong> {transcript.name}</p>
						<p><strong>NIM:</strong> {transcript.nim}</p>
						<p><strong>IPK:</strong> {transcript.ipk}</p>
						<h4 class="font-medium pt-2 border-t mt-2">Daftar Mata Kuliah:</h4>
						<table class="min-w-full divide-y divide-gray-200 mt-2 text-center">
							<thead class="bg-gray-100"><tr><th class="px-2 py-1">Kode</th><th class="px-2 py-1">Mata Kuliah</th><th class="px-2 py-1">SKS</th><th class="px-2 py-1">Nilai</th></tr></thead>
							<tbody class="divide-y">
								{#each transcript.courses as course}
									<tr><td class="px-2 py-1">{course.code}</td><td class="px-2 py-1 text-left">{course.name}</td><td class="px-2 py-1">{course.credits}</td><td class="px-2 py-1">{course.grade}</td></tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			{#if showInputForm}
				<form method="POST" action="?/inputRecord" class="space-y-8 bg-white p-8 shadow-lg sm:rounded-lg mb-8">
					<div class="flex justify-between items-center"><h2 class="text-2xl font-bold text-gray-800">Form Input Data Akademik</h2><button type="button" on:click={() => (showInputForm = false)} class="text-gray-500 hover:text-gray-800">&times; Tutup</button></div>
					<div>
						<label for="student" class="block text-sm font-medium text-gray-700">Pilih Mahasiswa</label>
						<select id="student" name="studentId" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
							<option disabled selected value="">-- Pilih salah satu --</option>
							{#each students as student} <option value={student.id}>{student.nim} - {student.fullName}</option> {/each}
						</select>
					</div>
					<div class="overflow-x-auto">
						<table class="min-w-full">
							<thead class="bg-gray-50"><tr><th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kode MK</th><th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nama</th><th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SKS</th><th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Indeks</th></tr></thead>
							<tbody class="divide-y divide-gray-200 bg-white">
								{#each courses as course, i}
									<tr>
										<td class="whitespace-nowrap px-4 py-2"><input type="text" name="course_{i}_code" bind:value={course.code} required class="w-full rounded-md border-gray-300 text-sm"/></td>
										<td class="whitespace-nowrap px-4 py-2"><input type="text" name="course_{i}_name" bind:value={course.name} required class="w-full rounded-md border-gray-300 text-sm"/></td>
										<td class="whitespace-nowrap px-4 py-2"><input type="number" name="course_{i}_credits" bind:value={course.credits} min="1" max="6" required class="w-20 rounded-md border-gray-300 text-sm"/></td>
										<td class="whitespace-nowrap px-4 py-2"><select name="course_{i}_grade" bind:value={course.grade} required class="w-24 rounded-md border-gray-300 text-sm">{#each gradeOptions as gradeOpt}<option value={gradeOpt}>{gradeOpt}</option>{/each}</select></td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div class="mt-4 rounded-md bg-indigo-50 p-4 text-right"><span class="text-lg font-bold text-indigo-800">IPK Terhitung: {ipk.toFixed(2)}</span><input type="hidden" name="ipk" value={ipk} /></div>
					<div><label for="aesKey" class="block text-sm font-medium text-gray-700">Kunci AES</label><input type="password" name="aesKey" required placeholder="Masukkan kunci rahasia untuk enkripsi" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
					<button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">Simpan</button>
				</form>
			{/if}

			{#if showGroupDecryptForm}
				<form method="POST" action="?/groupDecrypt" class="space-y-8 bg-white p-8 shadow-lg sm:rounded-lg mb-8">
					<div class="flex justify-between items-center"><h2 class="text-2xl font-bold text-gray-800">Form Dekripsi Grup</h2><button type="button" on:click={() => (showGroupDecryptForm = false)} class="text-gray-500 hover:text-gray-800">&times; Tutup</button></div>
					<div>
						<label for="recordId" class="block text-sm font-medium text-gray-700">Pilih Transkrip Mahasiswa</label>
						<select id="recordId" name="recordId" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
							<option disabled selected value="">-- Pilih record yang akan dibuka --</option>
							{#each allRecords as record} <option value={record.id}>{record.student.nim} - {record.student.fullName}</option> {/each}
						</select>
					</div>
					<div>
						<h3 class="text-lg font-medium text-gray-800">Masukkan 3 Bagian Kunci (Shares)</h3>
						<div class="mt-4 space-y-4">
							{#each [1, 2, 3] as i}
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
									<select name="advisorId{i}" required class="block w-full rounded-md border-gray-300 shadow-sm">
										<option disabled selected value="">-- Pilih Dosen Wali ke-{i} --</option>
										{#each allAdvisors as advisor} <option value={advisor.id}>{advisor.fullName}</option> {/each}
									</select>
									<input type="text" name="shareY{i}" required placeholder="Masukkan bagian kunci dari Dosen ke-{i}" class="block w-full rounded-md border-gray-300 shadow-sm"/>
								</div>
							{/each}
						</div>
					</div>
					<button type="submit" class="flex w-full justify-center rounded-md bg-yellow-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700">Rekonstruksi & Dekripsi</button>
					{#if form && 'groupDecryptSuccess' in form && form.groupDecryptSuccess}
						<div class="mt-6 border-t pt-6">
							<h3 class="text-xl font-semibold text-gray-900">Hasil Dekripsi</h3>
							<div class:border-green-500={form.verificationStatus === VerificationStatus.VERIFIED} class:border-red-500={form.verificationStatus !== VerificationStatus.VERIFIED} class="mt-4 border-l-4 p-4 bg-gray-50">
								<p>Status: <span class:text-green-700={form.verificationStatus === VerificationStatus.VERIFIED} class:text-red-700={form.verificationStatus !== VerificationStatus.VERIFIED} class="font-bold">{form.verificationStatus}</span> - ({form.verificationMessage})</p>
							</div>
							<div class="mt-4 text-sm">
								<p><strong>Nama:</strong> {form.decryptedData.name}</p>
								<p><strong>NIM:</strong> {form.decryptedData.nim}</p>
								<p><strong>IPK:</strong> {form.decryptedData.ipk}</p>
								<table class="min-w-full divide-y divide-gray-200 mt-2 text-center">
									<thead class="bg-gray-100"><tr><th class="px-2 py-1">Kode</th><th class="px-2 py-1">Mata Kuliah</th><th class="px-2 py-1">SKS</th><th class="px-2 py-1">Nilai</th></tr></thead>
									<tbody>
										{#each form.decryptedData.courses as course}
											<tr class="border-b"><td class="px-2 py-1">{course.code}</td><td class="px-2 py-1">{course.name}</td><td class="px-2 py-1">{course.credits}</td><td class="px-2 py-1">{course.grade}</td></tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}
					{#if form && 'groupDecryptError' in form}<div class="mt-4 text-red-600">{form.error}</div>{/if}
				</form>
			{/if}

			{#if showAllTranscriptsView}
				<div class="bg-white p-8 shadow-lg sm:rounded-lg mb-8">
					<div class="flex justify-between items-center mb-6"><h2 class="text-2xl font-bold text-gray-800">Daftar Transkrip Program Studi</h2><button type="button" on:click={() => {showAllTranscriptsView = false; viewedRecordDetails = null;}} class="text-gray-500 hover:text-gray-800">&times; Tutup</button></div>
					<div class="grid md:grid-cols-2 gap-8">
						<div class="border-r-0 md:border-r pr-0 md:pr-8">
							<h3 class="font-semibold text-lg">Pilih Record</h3>
							<ul class="mt-4 space-y-2 max-h-96 overflow-y-auto">
								{#each programRecords as record}
									<li>
										<form method="POST" action="?/viewRecord">
											<input type="hidden" name="recordId" value={record.id} />
											<button type="submit" class="text-left w-full p-3 rounded-md hover:bg-gray-100"><p class="font-medium">{record.student.fullName}</p><p class="text-sm text-gray-500">{record.student.nim} - Dibuat: {new Date(record.createdAt).toLocaleDateString()}</p></button>
										</form>
									</li>
								{:else}
									<p class="text-sm text-gray-500">Belum ada data transkrip di program studi ini.</p>
								{/each}
							</ul>
						</div>
						<div>
							<h3 class="font-semibold text-lg">Detail Transkrip</h3>
							{#if viewedRecordDetails}
								<div class="mt-4 space-y-2">
									<div class:border-green-500={viewedRecordDetails.verificationStatus === VerificationStatus.VERIFIED} class:border-red-500={viewedRecordDetails.verificationStatus !== VerificationStatus.VERIFIED} class="border-l-4 p-4 bg-gray-50"><p>Status: <span class="font-bold">{viewedRecordDetails.verificationStatus}</span> - ({viewedRecordDetails.verificationMessage})</p></div>
									<p><strong>Nama:</strong> {viewedRecordDetails.name}</p>
									<p><strong>NIM:</strong> {viewedRecordDetails.nim}</p>
									<p><strong>IPK:</strong> {viewedRecordDetails.ipk}</p>
									<h4 class="font-medium pt-2 border-t mt-2">Mata Kuliah:</h4>
									<div class="text-xs">{#each viewedRecordDetails.courses as course}<p>{course.code} - {course.name} ({course.credits} SKS) - Nilai: {course.grade}</p>{/each}</div>
								</div>
							{:else}
								<div class="mt-4 text-sm text-gray-500 bg-gray-50 p-4 rounded-md">Pilih record dari daftar di sebelah kiri untuk melihat detailnya.</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			{#if showSigningView}
				<div class="bg-white p-8 shadow-lg sm:rounded-lg mb-8">
					<div class="flex justify-between items-center mb-6"><h2 class="text-2xl font-bold text-gray-800">Tanda Tangan Digital Transkrip</h2><button type="button" on:click={() => showSigningView = false} class="text-gray-500 hover:text-gray-800">&times; Tutup</button></div>
					<table class="min-w-full">
						<thead><tr><th class="text-left py-2">Mahasiswa</th><th class="text-left py-2">Status TTD</th><th class="text-right py-2">Aksi</th></tr></thead>
						<tbody>
							{#each programRecords as record}
								<tr class="border-b">
									<td class="py-2">{record.student.fullName} ({record.student.nim})</td>
									<td class="py-2">
										{#if record.digitalSignature}
											<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Sudah Ditandatangani</span>
										{:else}
											<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Belum Ditandatangani</span>
										{/if}
									</td>
									<td class="py-2 text-right">
										<form method="POST" action="?/signRecord">
											<input type="hidden" name="recordId" value={record.id} />
											<button type="submit" class="text-sm font-medium text-indigo-600 hover:text-indigo-900">Tanda Tangani Ulang</button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			{#if showPdfView}
				<div class="space-y-8 bg-white p-8 shadow-lg sm:rounded-lg mb-8">
					<div class="flex justify-between items-center"><h2 class="text-2xl font-bold text-gray-800">Laporan Transkrip Akademik</h2><button type="button" on:click={() => (showPdfView = false)} class="text-gray-500 hover:text-gray-800">&times; Tutup</button></div>
					<div class="border-t pt-6">
						<h3 class="text-lg font-semibold text-gray-800">1. Generate & Unduh PDF</h3>
						<form method="POST" action="?/generatePdf" class="space-y-4 mt-4">
							<div>
								<label for="pdfRecordId" class="block text-sm font-medium text-gray-700">Pilih Transkrip</label>
								<select id="pdfRecordId" name="recordId" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
									<option disabled selected value="">-- Pilih record yang akan dicetak --</option>
									{#each programRecords as record}
										<option value={record.id}>{record.student.nim} - {record.student.fullName}</option>
									{/each}
								</select>
							</div>
							<div class="relative flex items-start"><div class="flex h-6 items-center"><input id="encrypt" name="encrypt" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600"/></div><div class="ml-3 text-sm"><label for="encrypt" class="font-medium text-gray-900">Enkripsi PDF dengan RC4</label></div></div>
							<div><label for="rc4Key" class="block text-sm font-medium text-gray-700">Kunci RC4 (Opsional)</label><input type="password" name="rc4Key" placeholder="Hanya diisi jika PDF dienkripsi" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
							<button type="submit" class="flex w-full justify-center rounded-md bg-green-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-green-700">Generate & Unduh</button>
						</form>
					</div>
					<div class="border-t pt-6">
						<h3 class="text-lg font-semibold text-gray-800">2. Buka PDF Terenkripsi</h3>
						<div class="space-y-4 mt-4">
							<div><label for="pdfFile" class="block text-sm font-medium text-gray-700">Pilih File .pdf</label><input type="file" bind:files={encryptedPdfFile} accept=".pdf" class="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/></div>
							<div><label for="decryptKey" class="block text-sm font-medium text-gray-700">Kunci Dekripsi RC4</label><input type="password" bind:value={decryptionKey} placeholder="Masukkan kunci untuk dekripsi" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
							<button type="button" on:click={handleDecryptPdf} class="flex w-full justify-center rounded-md bg-sky-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">Buka & Tampilkan</button>
							{#if decryptPdfError}<p class="text-sm text-red-600 mt-2">{decryptPdfError}</p>{/if}
							{#if decryptedPdfContent}
								<div class="mt-4"><h4 class="font-medium">Isi File Terdekripsi:</h4><pre class="bg-gray-100 p-4 rounded-md text-xs whitespace-pre-wrap">{decryptedPdfContent}</pre></div>
							{/if}
						</div>
					</div>
				</div>
			{/if}
			
			<div class="bg-white p-6 shadow-lg sm:rounded-lg sm:p-8">
				<div class="mb-6"><h2 class="text-2xl font-semibold leading-7 text-gray-800">Selamat Datang, {user.fullName}!</h2><p class="mt-2 text-base text-gray-600">Anda masuk sebagai: <span class="font-bold text-indigo-700">{translateRole(user.role)}</span></p></div>
				<div>
					<h3 class="text-xl font-semibold leading-6 text-gray-800">Menu Akses Anda</h3>
					<div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{#if user.role === 'Mahasiswa'}
							<div class="overflow-hidden rounded-lg bg-indigo-50 p-5 shadow"><h4 class="truncate text-lg font-medium text-indigo-900">Lihat Transkrip</h4><p class="mt-1 text-sm text-indigo-800">Akses data transkrip akademik Anda.</p><form method="POST" action="?/viewMyTranscript" class="inline"><button type="submit" class="mt-4 font-semibold text-indigo-600 hover:text-indigo-800">Buka Transkrip &rarr;</button></form></div>
						{/if}
						{#if user.role === 'Dosen_Wali'}
							<div class="overflow-hidden rounded-lg bg-blue-50 p-5 shadow"><h4 class="truncate text-lg font-medium text-blue-900">Input Data Mahasiswa</h4><p class="mt-1 text-sm text-blue-800">Masukkan data nilai mahasiswa.</p><button type="button" on:click={() => (showInputForm = true)} class="mt-4 inline-block font-semibold text-blue-600 hover:text-blue-800">Mulai Input &rarr;</button></div>
							<div class="overflow-hidden rounded-lg bg-yellow-50 p-5 shadow"><h4 class="truncate text-lg font-medium text-yellow-900">Dekripsi Grup</h4><p class="mt-1 text-sm text-yellow-800">Buka data transkrip bersama.</p><button type="button" on:click={() => (showGroupDecryptForm = true)} class="mt-4 inline-block font-semibold text-yellow-600 hover:text-yellow-800">Mulai Proses &rarr;</button></div>
						{/if}
						{#if user.role === 'Kepala_Program_Studi'}
							<div class="overflow-hidden rounded-lg bg-purple-50 p-5 shadow"><h4 class="truncate text-lg font-medium text-purple-900">Lihat Semua Data</h4><p class="mt-1 text-sm text-purple-800">Akses seluruh transkrip prodi.</p><button type="button" on:click={() => (showAllTranscriptsView = true)} class="mt-4 inline-block font-semibold text-purple-600 hover:text-purple-800">Akses Data &rarr;</button></div>
							<div class="overflow-hidden rounded-lg bg-red-50 p-5 shadow"><h4 class="truncate text-lg font-medium text-red-900">Tanda Tangan Digital</h4><p class="mt-1 text-sm text-red-800">Tanda tangani data akademik.</p><button type="button" on:click={() => (showSigningView = true)} class="mt-4 inline-block font-semibold text-red-600 hover:text-red-800">Buka Menu &rarr;</button></div>
						{/if}
					</div>
					<div class="mt-6 border-t pt-6">
						<h3 class="text-lg font-semibold leading-6 text-gray-800">Aksi Umum</h3>
						<div class="mt-4">
							<button type="button" on:click={() => showPdfView = true} class="rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-800 shadow-sm hover:bg-green-100">
								Cetak Transkrip ke PDF
							</button>
						</div>
					</div>
				</div>
			</div>
		</main>
	</div>
</div>