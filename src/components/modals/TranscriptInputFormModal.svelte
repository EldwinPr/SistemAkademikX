<script lang="ts">
	import BaseModal from './BaseModal.svelte';
	import LoadingButton from '../shared/LoadingButton.svelte';
	import { BBSUtils } from '$lib/cryptography/BBS';
	
	export let show = false;
	export let students: any[] = [];
	export let loading = false;
	
	// Form data - start with 1 empty course		
	let courses = [{ code: '', name: '', credits: 2, grade: 'A' }];
	let ipk = 0.0;
	let generatedAESKey = '';
	let selectedStudentId = '';
	
	let errors = [{ code: '', name: '' }];

	const gradePoints: { [key: string]: number } = { 
		A: 4.0, AB: 3.5, B: 3.0, BC: 2.5, C: 2.0, D: 1.0, E: 0.0 
	};
	const gradeOptions = Object.keys(gradePoints);

	const sampleSTICourses = [
		{ code: 'II2130', name: 'Sistem dan Arsitektur Komputer', credits: 2, grade: 'A' },
		{ code: 'II2110', name: 'Matematika STI', credits: 2, grade: 'AB' },
		{ code: 'II2111', name: 'Probabilitas dan Statistik', credits: 2, grade: 'A' },
		{ code: 'TI3005', name: 'Organisasi & Manajemen Perusahaan Industri', credits: 2, grade: 'B' },
		{ code: 'IF2140', name: 'Pemodelan Basis Data', credits: 2, grade: 'AB' },
		{ code: 'IF2111', name: 'Algoritma dan Struktur Data STI', credits: 2, grade: 'A' },
		{ code: 'II2250', name: 'Manajemen Basis Data', credits: 2, grade: 'A' },
		{ code: 'II2260', name: 'Sistem Embedded', credits: 2, grade: 'AB' },
		{ code: 'II2230', name: 'Jaringan Komputer', credits: 2, grade: 'A' },
		{ code: 'II2220', name: 'Manajemen Sumber Daya STI', credits: 2, grade: 'B' }
	];

	const sampleIFCourses = [
		{ code: 'IF2121', name: 'Logika Komputasional', credits: 2, grade: 'A' },
		{ code: 'IF2110', name: 'Algoritma & Struktur Data', credits: 2, grade: 'A' },
		{ code: 'IF2120', name: 'Matematika Diskrit', credits: 2, grade: 'AB' },
		{ code: 'IF2124', name: 'Teori Bahasa Formal dan Otomata', credits: 2, grade: 'A' },
		{ code: 'IF2123', name: 'Aljabar Linier dan Geometri', credits: 2, grade: 'AB' },
		{ code: 'IF2130', name: 'Organisasi dan Arsitektur Komputer', credits: 2, grade: 'A' },
		{ code: 'IF2210', name: 'Pemrograman Berorientasi Objek', credits: 2, grade: 'A' },
		{ code: 'IF2211', name: 'Strategi Algoritma', credits: 2, grade: 'AB' },
		{ code: 'IF2220', name: 'Probabilitas dan Statistika', credits: 2, grade: 'A' },
		{ code: 'IF2230', name: 'Sistem Operasi', credits: 2, grade: 'B' }
	];

	// Generate AES key when form is shown
	$: if (show && !generatedAESKey) {
		generatedAESKey = BBSUtils.generateSecureAESKey(256);
	}

	function calculateIPK() {
		let totalPoints = 0;
		let totalCredits = 0;
		
		for (const course of courses) {
			if (course.code && course.name && course.credits > 0 && gradePoints[course.grade] !== undefined) {
				totalPoints += gradePoints[course.grade] * course.credits;
				totalCredits += Number(course.credits);
			}
		}
		ipk = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0.0;
	}
	
	function calculateTotalSKS() {
		return courses.reduce((total, course) => {
			if (course.code && course.name) {
				return total + Number(course.credits);
			}
			return total;
		}, 0);
	}
	
	// Reactive calculations
	$: if (courses) calculateIPK();
	$: totalSKS = calculateTotalSKS();
	$: filledCourses = courses.filter(course => course.code && course.name).length;
	$: canAddCourse = courses.length < 12 && totalSKS < 24;
	$: canRemoveCourse = courses.length > 1;

	function addCourse() {
		if (canAddCourse) {
			courses = [...courses, { code: '', name: '', credits: 2, grade: 'A' }];
			errors = [...errors, { code: '', name: '' }];
		}
	}

	function removeCourse(index: number) {
		if (canRemoveCourse) {
			courses = courses.filter((_, i) => i !== index);
			errors = errors.filter((_, i) => i !== index);
		}
	}

	function handleClose() {
		show = false;
		resetForm();
	}

	function quickFill10Courses() {
		if (!selectedStudentId) {
			alert('Pilih mahasiswa terlebih dahulu untuk quick fill yang sesuai');
			return;
		}
		
		const selectedStudent = students.find(s => s.id === selectedStudentId);
		const isSTI = selectedStudent?.nim?.startsWith('182') || selectedStudent?.programStudi === 'Sistem_Teknologi_Informasi';
		
		const coursesToUse = isSTI ? sampleSTICourses : sampleIFCourses;
		
		courses = [...coursesToUse];
		errors = new Array(coursesToUse.length).fill({ code: '', name: '' });
		calculateIPK();
	}

	function clearAllCourses() {
		courses = [{ code: '', name: '', credits: 2, grade: 'A' }];
		errors = [{ code: '', name: '' }];
		ipk = 0.0;
	}

	function resetForm() {
		selectedStudentId = '';
		courses = [{ code: '', name: '', credits: 2, grade: 'A' }];
		errors = [{ code: '', name: '' }];
		ipk = 0.0;
		generatedAESKey = BBSUtils.generateSecureAESKey(256);
	}

	function handleCreditsChange(index: number, newCredits: number) {
		const tempCourses = [...courses];
		tempCourses[index].credits = newCredits;
		
		const tempTotal = tempCourses.reduce((total, course) => {
			if (course.code && course.name) {
				return total + Number(course.credits);
			}
			return total;
		}, 0);
		
		if (tempTotal <= 24) {
			courses[index].credits = newCredits;
		}
	}

	function validateCourseCode(index: number) {
		const code = courses[index].code;
		if (!code) {
			errors[index].code = "Kode MK tidak boleh kosong.";
			return;
		}
		const courseCodeRegex = /^[A-Z]{2}\d{4}$/; 
		if (!courseCodeRegex.test(code)) {
			errors[index].code = "Format salah (contoh: IF2110).";
		} else {
			errors[index].code = "";
		}
	}

	function validateCourseName(index: number) {
		const name = courses[index].name;
		if (!name.trim()) {
			errors[index].name = "Nama mata kuliah tidak boleh kosong.";
		} else {
			errors[index].name = "";
		}
	}

	function isFormValid(): boolean {
		return selectedStudentId !== '' && 
			   filledCourses > 0 && 
			   totalSKS <= 24 &&
			   errors.every(error => error.code === '' && error.name === '');
	}

	async function handleSubmit() {
		if (!isFormValid()) return;
		
		loading = true;
		
		try {
			const formData = new FormData();
			formData.append('studentId', selectedStudentId);
			formData.append('aesKey', generatedAESKey);
			formData.append('ipk', ipk.toString());
			
			// Add courses data
			courses.forEach((course, i) => {
				if (course.code && course.name) {
					formData.append(`courses[${i}][code]`, course.code);
					formData.append(`courses[${i}][name]`, course.name);
					formData.append(`courses[${i}][credits]`, course.credits.toString());
					formData.append(`courses[${i}][grade]`, course.grade);
				}
			});
			
			const response = await fetch('?/inputRecord', {
				method: 'POST',
				body: formData
			});
			
			if (response.ok) {
				handleClose();
			} else {
				alert('Gagal menyimpan data akademik');
			}
		} catch (error) {
			console.error('Error submitting form:', error);
			alert('Terjadi kesalahan saat menyimpan data');
		} finally {
			loading = false;
		}
	}
</script>

<BaseModal 
	bind:show 
	title="Form Input Data Akademik"
	maxWidth="max-w-7xl"
	on:close={handleClose}
>
	<div class="p-6 space-y-6">
		<!-- Student Selection -->
		<div>
			<label for="student" class="block text-sm font-medium text-gray-700 mb-2">
				Pilih Mahasiswa <span class="text-red-500">*</span>
			</label>
			<select 
				id="student" 
				bind:value={selectedStudentId}
				required 
				class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
			>
				<option disabled value="">-- Pilih salah satu --</option>
				{#each students as student}
					<option value={student.id}>{student.nim} - {student.fullName}</option>
				{/each}
			</select>
		</div>

		<!-- Course Stats -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="bg-blue-50 border border-blue-200 rounded-md p-3">
				<p class="text-sm text-blue-800">
					<strong>Mata Kuliah:</strong> {filledCourses} diisi
				</p>
			</div>
			<div class="bg-green-50 border border-green-200 rounded-md p-3">
				<p class="text-sm text-green-800">
					<strong>Total SKS:</strong> {totalSKS}/24
				</p>
			</div>
			<div class="bg-indigo-50 border border-indigo-200 rounded-md p-3">
				<p class="text-sm text-indigo-800">
					<strong>IPK:</strong> {ipk.toFixed(2)}
				</p>
			</div>
		</div>

		<!-- Course Management Buttons -->
		<div class="flex gap-4 items-center">
			<LoadingButton
				variant="success"
				size="sm"
				disabled={!canAddCourse}
				on:click={addCourse}
			>
				+ Tambah Mata Kuliah
			</LoadingButton>
			{#if !canAddCourse}
				<p class="text-xs text-gray-500">
					{#if courses.length >= 12}
						Maksimal 12 mata kuliah
					{:else if totalSKS >= 24}
						Maksimal 24 SKS tercapai
					{/if}
				</p>
			{/if}
		</div>

		<!-- Quick Fill Options -->
		<div class="flex gap-4 items-center bg-yellow-50 border border-yellow-200 rounded-md p-4">
			<div class="flex-1">
				<h4 class="text-sm font-medium text-yellow-800">Quick Fill Options</h4>
				<p class="text-xs text-yellow-700 mt-1">Isi otomatis dengan 10 mata kuliah standar sesuai program studi</p>
			</div>
			<div class="flex gap-2">
				<LoadingButton 
					variant="secondary"
					size="sm"
					on:click={quickFill10Courses}
				>
					⚡ Quick Fill 10 MK
				</LoadingButton>
				<LoadingButton 
					variant="secondary"
					size="sm"
					on:click={clearAllCourses}
				>
					Clear All
				</LoadingButton>
			</div>
		</div>

		<!-- Courses Table -->
		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">#</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kode MK</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nama Mata Kuliah</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SKS</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Indeks</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each courses as course, i}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-2 text-sm text-gray-500">{i + 1}</td>
							<td class="whitespace-nowrap px-4 py-2">
								<input 
									type="text" 
									bind:value={course.code}
									on:blur={() => validateCourseCode(i)} 
									class="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									class:border-red-300={errors[i]?.code}
								/>
								{#if errors[i]?.code}
									<p class="text-xs text-red-500 mt-1">{errors[i].code}</p>
								{/if}
							</td>
							<td class="px-4 py-2">
								<input 
									type="text" 
									bind:value={course.name}
									on:blur={() => validateCourseName(i)} 
									class="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									class:border-red-300={errors[i]?.name}
								/>
								{#if errors[i]?.name}
									<p class="text-xs text-red-500 mt-1">{errors[i].name}</p>
								{/if}
							</td>
							<td class="whitespace-nowrap px-4 py-2">
								<input 
									type="number" 
									value={course.credits}
									on:input={(e) => handleCreditsChange(i, parseInt((e.target as HTMLInputElement).value) || 2)}
									min="1" 
									max="6" 
									class="w-20 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
								/>
							</td>
							<td class="whitespace-nowrap px-4 py-2">
								<select 
									bind:value={course.grade} 
									class="w-24 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
								>
									{#each gradeOptions as gradeOpt}
										<option value={gradeOpt}>{gradeOpt}</option>
									{/each}
								</select>
							</td>
							<td class="whitespace-nowrap px-4 py-2">
								<button 
									type="button" 
									on:click={() => removeCourse(i)}
									disabled={!canRemoveCourse}
									class="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
									aria-label="Hapus mata kuliah"
								>
									<span class="text-lg">×</span>
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Validation Messages -->
		{#if filledCourses === 0}
			<div class="bg-red-50 border border-red-200 rounded-md p-3">
				<p class="text-sm text-red-800">
					⚠️ Minimal isi 1 mata kuliah untuk melanjutkan
				</p>
			</div>
		{/if}

		{#if totalSKS > 24}
			<div class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
				<p class="text-sm text-yellow-800">
					⚠️ Total SKS melebihi batas maksimal (24 SKS)
				</p>
			</div>
		{/if}
	</div>

	<svelte:fragment slot="footer">
		<div class="flex gap-3 justify-end">
			<LoadingButton 
				variant="primary"
				{loading}
				loadingText="Menyimpan..."
				disabled={!isFormValid() || loading}
				on:click={handleSubmit}
			>
				Simpan Data Akademik
			</LoadingButton>
			<LoadingButton 
				variant="secondary"
				on:click={resetForm}
				disabled={loading}
			>
				Reset
			</LoadingButton>
		</div>
	</svelte:fragment>
</BaseModal>