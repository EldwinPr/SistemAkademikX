<script lang="ts">
	import { BBSUtils } from '$lib/cryptography/BBS';
	
	export let students: any[] = [];
	export let showForm = false;
	
	// Form data - start with 1 empty course		
	let courses = [{ code: '', name: '', credits: 2, grade: 'A' }];
	let ipk = 0.0;
	let generatedAESKey = '';
	
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
	$: if (showForm && !generatedAESKey) {
		generatedAESKey = BBSUtils.generateSecureAESKey(256);
	}

	function calculateIPK() {
		let totalPoints = 0;
		let totalCredits = 0;
		
		// Only calculate for courses that have been filled
		for (const course of courses) {
			if (course.code && course.name && course.credits > 0 && gradePoints[course.grade] !== undefined) {
				totalPoints += gradePoints[course.grade] * course.credits;
				totalCredits += Number(course.credits);
			}
		}
		ipk = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0.0;
	}
	
	// Calculate total SKS
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
		}
	}

	function removeCourse(index: number) {
		if (canRemoveCourse) {
			courses = courses.filter((_, i) => i !== index);
		}
	}

	function closeForm() {
		showForm = false;
		// Reset form when closing
		resetForm();
	}

	function quickFill10Courses() {
		const studentSelect = document.getElementById('student') as HTMLSelectElement;
		const selectedStudentId = studentSelect?.value;
		
		if (!selectedStudentId) {
			alert('Pilih mahasiswa terlebih dahulu untuk quick fill yang sesuai');
			return;
		}
		
		const selectedStudent = students.find(s => s.id === selectedStudentId);
		const isSTI = selectedStudent?.nim?.startsWith('182') || selectedStudent?.programStudi === 'Sistem_Teknologi_Informasi';
		
		// Use appropriate course set based on student's program
		const coursesToUse = isSTI ? sampleSTICourses : sampleIFCourses;
		
		courses = [...coursesToUse];
		calculateIPK();
	}

	function clearAllCourses() {
		courses = [{ code: '', name: '', credits: 2, grade: 'A' }];
		ipk = 0.0;
	}

	function resetForm() {
		courses = [{ code: '', name: '', credits: 2, grade: 'A' }];
		ipk = 0.0;
		generatedAESKey = BBSUtils.generateSecureAESKey(256);
	}

	// Validate SKS when credits change
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
            errors[index].code = ""; // Valid
        }
	}

	function validateCourseName(index: number) {
        const name = courses[index].name;
        if (!name.trim()) {
            errors[index].name = "Nama mata kuliah tidak boleh kosong.";
        } else {
            errors[index].name = ""; // Valid
        }
    }
</script>

{#if showForm}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-screen items-center justify-center p-4">
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={closeForm}></div>
			<div class="relative bg-white rounded-lg shadow-xl w-full max-w-7xl my-8">
				<form method="POST" action="?/inputRecord">
					<!-- Modal Header -->
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-semibold text-gray-900">Form Input Data Akademik</h3>
							<button type="button" class="text-gray-400 hover:text-gray-600" on:click={closeForm}>
								<span class="text-2xl">&times;</span>
							</button>
						</div>
					</div>

					<!-- Modal Content -->
					<div class="p-6 space-y-6">
						<!-- Student Selection -->
						<div>
							<label for="student" class="block text-sm font-medium text-gray-700">
								Pilih Mahasiswa <span class="text-red-500">*</span>
							</label>
							<select 
								id="student" 
								name="studentId" 
								required 
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							>
								<option disabled selected value="">-- Pilih salah satu --</option>
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

						<!-- Add/Remove Course Buttons -->
						<div class="flex gap-4 items-center">
							<button 
								type="button" 
								on:click={addCourse}
								disabled={!canAddCourse}
								class="flex items-center gap-2 rounded-md bg-green-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
							>
								<span class="text-lg">+</span>
								Tambah Mata Kuliah
							</button>
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
						<div class="flex gap-4 items-center bg-yellow-50 border border-yellow-200 rounded-md p-4">
							<div class="flex-1">
								<h4 class="text-sm font-medium text-yellow-800">Quick Fill Options</h4>
								<p class="text-xs text-yellow-700 mt-1">Isi otomatis dengan 10 mata kuliah standar sesuai program studi</p>
							</div>
							<div class="flex gap-2">
								<button 
									type="button" 
									on:click={quickFill10Courses}
									class="flex items-center gap-2 rounded-md bg-yellow-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700"
								>
									<span class="text-lg">⚡</span>
									Quick Fill 10 MK
								</button>
								<button 
									type="button" 
									on:click={clearAllCourses}
									class="rounded-md bg-gray-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
								>
									Clear All
								</button>
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
													name="courses[{i}][code]" 
													bind:value={course.code}
													on:blur={() => validateCourseCode(i)} 
													class="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
												/>
											</td>
											<td class="px-4 py-2">
												<input 
													type="text" 
													name="courses[{i}][name]" 
													bind:value={course.name}
													on:blur={() => validateCourseName(i)} 
													class="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
												/>
											</td>
											<td class="whitespace-nowrap px-4 py-2">
												<input 
													type="number" 
													name="courses[{i}][credits]" 
													value={course.credits}
													on:input={(e) => handleCreditsChange(i, parseInt((e.target as HTMLInputElement).value) || 2)}
													min="1" 
													max="6" 
													class="w-20 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
												/>
											</td>
											<td class="whitespace-nowrap px-4 py-2">
												<select 
													name="courses[{i}][grade]" 
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

						<!-- Generated AES Key (Hidden) -->
						<input type="hidden" name="aesKey" value={generatedAESKey} />
						<input type="hidden" name="ipk" value={ipk} />

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

					<!-- Modal Footer -->
					<div class="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
						<div class="flex gap-4">
							<button 
								type="submit" 
								disabled={filledCourses === 0 || totalSKS > 24}
								class="flex-1 justify-center rounded-md bg-indigo-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
							>
								Simpan Data Akademik
							</button>
							<button 
								type="button" 
								on:click={resetForm}
								class="justify-center rounded-md bg-gray-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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