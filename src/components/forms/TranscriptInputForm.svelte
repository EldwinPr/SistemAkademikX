<!-- src/components/TranscriptInputForm.svelte -->
<script lang="ts">
	import { BBSUtils } from '../lib/cryptography/BBS';
	
	export let students: any[] = [];
	export let showForm = false;
	
	// Form data - start with 1 empty course
	let courses = [{ code: '', name: '', credits: 2, grade: 'A' }];
	let ipk = 0.0;
	let generatedAESKey = '';
	
	const gradePoints: { [key: string]: number } = { 
		A: 4.0, AB: 3.5, B: 3.0, BC: 2.5, C: 2.0, D: 1.0, E: 0.0 
	};
	const gradeOptions = Object.keys(gradePoints);

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
</script>

{#if showForm}
	<form method="POST" action="?/inputRecord" class="space-y-8 bg-white p-8 shadow-lg sm:rounded-lg mb-8">
		<div class="flex justify-between items-center">
			<h2 class="text-2xl font-bold text-gray-800">Form Input Data Akademik</h2>
			<button 
				type="button" 
				on:click={closeForm} 
				class="text-gray-500 hover:text-gray-800 text-2xl font-bold"
				aria-label="Tutup form"
			>
				&times;
			</button>
		</div>

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

		<!-- Courses Table -->
		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							#
						</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Kode MK
						</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Nama Mata Kuliah
						</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							SKS
						</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Indeks
						</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Aksi
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each courses as course, i}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-2 text-sm text-gray-500">
								{i + 1}
							</td>
							<td class="whitespace-nowrap px-4 py-2">
								<input 
									type="text" 
									name="course_{i}_code" 
									bind:value={course.code} 
									class="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
								/>
							</td>
							<td class="px-4 py-2">
								<input 
									type="text" 
									name="course_{i}_name" 
									bind:value={course.name} 
									class="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
								/>
							</td>
							<td class="whitespace-nowrap px-4 py-2">
								<input 
									type="number" 
									name="course_{i}_credits" 
									value={course.credits}
									on:input={(e) => handleCreditsChange(i, parseInt((e.target as HTMLInputElement).value) || 2)}
									min="1" 
									max="6" 
									class="w-20 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
								/>
							</td>
							<td class="whitespace-nowrap px-4 py-2">
								<select 
									name="course_{i}_grade" 
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

		<!-- Action Buttons -->
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
	</form>
{/if}