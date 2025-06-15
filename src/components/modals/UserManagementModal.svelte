<script lang="ts">
	import BaseModal from './BaseModal.svelte';
	import LoadingButton from '../shared/LoadingButton.svelte';
	import DeleteConfirmModal from './DeleteConfirmModal.svelte';
	
	export let show = false;
	export let allAdvisors: any[] = [];
	export let allStudents: any[] = [];
	export let currentUserProgram: string = 'Teknik_Informatika';
	export let loading = false;

	let activeTab: 'advisors' | 'students' | 'register' = 'advisors';
	let registerType: 'dosen' | 'student' = 'dosen';

	// Auto NIM generation
	let selectedProgram = 'Teknik_Informatika';
	let entryYear = new Date().getFullYear();
	let generatedNIM = '';

	// Delete confirmation state
	let showDeleteConfirm = false;
	let userToDelete: any = null;
	let deleteType: 'advisor' | 'student' = 'advisor';

	// Form submission loading states
	let registerLoading = false;
	let assignLoading: Record<string, boolean> = {};

	// Generate NIM when program or year changes
	$: if (registerType === 'student') {
		generateNIM();
	}

	// Get students for each advisor
	$: advisorsWithStudents = allAdvisors.map(advisor => ({
		...advisor,
		students: allStudents.filter(student => student.DosenId === advisor.id)
	}));

	function handleClose() {
		show = false;
		resetForm();
	}

	function setActiveTab(tab: 'advisors' | 'students' | 'register') {
		activeTab = tab;
		resetDeleteState();
	}

	function resetDeleteState() {
		showDeleteConfirm = false;
		userToDelete = null;
	}

	function resetForm() {
		activeTab = 'advisors';
		registerType = 'dosen';
		resetDeleteState();
		registerLoading = false;
		assignLoading = {};
	}

	function generateNIM() {
		if (registerType !== 'student') return;
		
		const programCode = currentUserProgram === 'Teknik_Informatika' ? '135' : '182';
		const yearSuffix = entryYear.toString().slice(-2);
		
		const samePattern = allStudents.filter(student => 
			student.nim?.startsWith(programCode + yearSuffix)
		);
		
		const nextNumber = (samePattern.length + 1).toString().padStart(3, '0');
		generatedNIM = programCode + yearSuffix + nextNumber;
	}

	function confirmDelete(user: any, type: 'advisor' | 'student') {
		userToDelete = user;
		deleteType = type;
		showDeleteConfirm = true;
	}

	function cancelDelete() {
		resetDeleteState();
	}

	async function handleRegisterSubmit(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		
		registerLoading = true;
		
		try {
			const response = await fetch('?/registerUser', {
				method: 'POST',
				body: formData
			});
			
			if (response.ok) {
				form.reset();
				if (registerType === 'student') {
					generateNIM(); // Regenerate NIM for next student
				}
			} else {
				alert('Gagal mendaftarkan pengguna');
			}
		} catch (error) {
			console.error('Error registering user:', error);
			alert('Terjadi kesalahan saat mendaftarkan pengguna');
		} finally {
			registerLoading = false;
		}
	}

	async function handleAssignAdvisor(studentId: string, advisorId: string) {
		assignLoading[studentId] = true;
		
		try {
			const formData = new FormData();
			formData.append('studentId', studentId);
			formData.append('advisorId', advisorId);
			
			const response = await fetch('?/assignAdvisor', {
				method: 'POST',
				body: formData
			});
			
			if (!response.ok) {
				alert('Gagal mengubah dosen wali');
			}
		} catch (error) {
			console.error('Error assigning advisor:', error);
			alert('Terjadi kesalahan');
		} finally {
			assignLoading[studentId] = false;
		}
	}

	function getDeleteWarnings(user: any, type: 'advisor' | 'student'): string[] {
		if (type === 'advisor') {
			const studentCount = advisorsWithStudents.find(a => a.id === user.id)?.students?.length || 0;
			return [
				'Data dosen wali',
				`Hubungan bimbingan dengan ${studentCount} mahasiswa`,
				'Secret shares yang dimiliki dosen',
				'Sesi login aktif'
			];
		} else {
			return [
				'Data mahasiswa',
				'Semua transkrip akademik',
				'Kunci akses (direct keys)',
				'Secret shares terkait',
				'Sesi login aktif'
			];
		}
	}
</script>

<BaseModal 
	bind:show 
	title="Manajemen Pengguna"
	maxWidth="max-w-6xl"
	on:close={handleClose}
>
	<!-- Tab Navigation -->
	<div class="border-b border-gray-200">
		<nav class="flex px-6">
			<button
				type="button"
				class="py-4 px-6 text-sm font-medium border-b-2 transition-colors
					   {activeTab === 'advisors' 
						? 'border-indigo-500 text-indigo-600' 
						: 'border-transparent text-gray-500 hover:text-gray-700'}"
				on:click={() => setActiveTab('advisors')}
			>
				Dosen Wali ({allAdvisors.length})
			</button>
			<button
				type="button"
				class="py-4 px-6 text-sm font-medium border-b-2 transition-colors
					   {activeTab === 'students' 
						? 'border-indigo-500 text-indigo-600' 
						: 'border-transparent text-gray-500 hover:text-gray-700'}"
				on:click={() => setActiveTab('students')}
			>
				Mahasiswa ({allStudents.length})
			</button>
			<button
				type="button"
				class="py-4 px-6 text-sm font-medium border-b-2 transition-colors
					   {activeTab === 'register' 
						? 'border-indigo-500 text-indigo-600' 
						: 'border-transparent text-gray-500 hover:text-gray-700'}"
				on:click={() => setActiveTab('register')}
			>
				Daftar Baru
			</button>
		</nav>
	</div>

	<!-- Tab Content -->
	<div class="p-6">
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
					<p class="text-gray-600">Memuat data pengguna...</p>
				</div>
			</div>
		{:else}
			<!-- Advisors Tab -->
			{#if activeTab === 'advisors'}
				<div>
					<div class="mb-4 flex justify-between items-center">
						<h4 class="text-lg font-medium text-gray-900">Daftar Dosen Wali</h4>
						<p class="text-sm text-gray-600">{allAdvisors.length} dosen wali terdaftar</p>
					</div>
					
					{#if allAdvisors.length > 0}
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
										<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
										<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahasiswa Bimbingan</th>
										<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each advisorsWithStudents as advisor}
										<tr class="hover:bg-gray-50">
											<td class="px-4 py-3 text-sm text-gray-900">{advisor.fullName}</td>
											<td class="px-4 py-3 text-sm text-gray-500">{advisor.username}</td>
											<td class="px-4 py-3 text-sm text-gray-500">
												{#if advisor.students.length > 0}
													<div class="space-y-1">
														{#each advisor.students as student}
															<div class="text-xs bg-blue-50 px-2 py-1 rounded">
																{student.fullName} ({student.nim})
															</div>
														{/each}
													</div>
												{:else}
													<span class="text-gray-400 italic">Tidak ada</span>
												{/if}
											</td>
											<td class="px-4 py-3 text-sm space-x-2 text-right">
												<LoadingButton
													variant="danger"
													size="sm"
													on:click={() => confirmDelete(advisor, 'advisor')}
												>
													Hapus
												</LoadingButton>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="text-center py-8">
							<p class="text-sm text-gray-500">Belum ada data dosen wali</p>
						</div>
					{/if}
				</div>

			<!-- Students Tab -->
			{:else if activeTab === 'students'}
				<div>
					<div class="mb-4 flex justify-between items-center">
						<h4 class="text-lg font-medium text-gray-900">Daftar Mahasiswa</h4>
						<p class="text-sm text-gray-600">{allStudents.length} mahasiswa terdaftar</p>
					</div>
					
					{#if allStudents.length > 0}
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
										<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIM</th>
										<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosen Wali</th>
										<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each allStudents as student}
										<tr class="hover:bg-gray-50">
											<td class="px-4 py-3 text-sm text-gray-900">{student.fullName}</td>
											<td class="px-4 py-3 text-sm text-gray-500">{student.nim}</td>
											<td class="px-4 py-3 text-sm text-gray-500">
												<div class="flex items-center gap-2">
													<select 
														class="text-xs rounded border-gray-300 flex-1"
														value={student.DosenId || ''}
														on:change={(e) => {
															const advisorId = (e.target as HTMLSelectElement).value;
															if (advisorId !== (student.DosenId || '')) {
																handleAssignAdvisor(student.id, advisorId);
															}
														}}
														disabled={assignLoading[student.id]}
													>
														<option value="">Pilih Dosen Wali</option>
														{#each allAdvisors as advisor}
															<option value={advisor.id} selected={student.DosenId === advisor.id}>
																{advisor.fullName}
															</option>
														{/each}
													</select>
													{#if assignLoading[student.id]}
														<div class="animate-spin h-3 w-3 border border-indigo-600 border-t-transparent rounded-full"></div>
													{/if}
												</div>
											</td>
											<td class="px-4 py-3 text-sm text-right">
												<LoadingButton
													variant="danger"
													size="sm"
													on:click={() => confirmDelete(student, 'student')}
												>
													Hapus
												</LoadingButton>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="text-center py-8">
							<p class="text-sm text-gray-500">Belum ada data mahasiswa</p>
						</div>
					{/if}
				</div>

			<!-- Register Tab -->
			{:else if activeTab === 'register'}
				<div>
					<h4 class="text-lg font-medium text-gray-900 mb-4">Daftar Pengguna Baru</h4>
					
					<!-- Register Type Selection -->
					<div class="mb-6">
						<div class="flex space-x-4">
							<label class="flex items-center">
								<input 
									type="radio" 
									bind:group={registerType} 
									value="dosen"
									class="h-4 w-4 text-indigo-600"
								/>
								<span class="ml-2 text-sm text-gray-900">Dosen Wali</span>
							</label>
							<label class="flex items-center">
								<input 
									type="radio" 
									bind:group={registerType} 
									value="student"
									class="h-4 w-4 text-indigo-600"
								/>
								<span class="ml-2 text-sm text-gray-900">Mahasiswa</span>
							</label>
						</div>
					</div>

					<!-- Registration Form -->
					<form on:submit={handleRegisterSubmit} class="space-y-4">
						<!-- Hidden fields -->
						<input type="hidden" name="userType" value={registerType} />
						<input type="hidden" name="role" value={registerType === 'dosen' ? 'Dosen_Wali' : 'Mahasiswa'} />
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
								<input 
									type="text" 
									name="username" 
									required 
									class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
									placeholder="Username unik"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
								<input 
									type="password" 
									name="password" 
									required 
									class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
									placeholder="Password"
								/>
							</div>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
							<input 
								type="text" 
								name="fullName" 
								required 
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
								placeholder="Nama lengkap pengguna"
							/>
						</div>

						{#if registerType === 'student'}
							<!-- Program restriction message -->
							<div class="bg-blue-50 border border-blue-200 rounded-md p-3">
								<p class="text-sm text-blue-800">
									ℹ️ Mahasiswa akan didaftarkan ke program studi yang sama dengan Anda (Kepala Program Studi).
								</p>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">Tahun Masuk</label>
									<input 
										type="number" 
										bind:value={entryYear}
										min="2000"
										max="2030"
										class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">NIM (Auto-generated)</label>
									<input 
										type="text" 
										name="nim" 
										value={generatedNIM}
										readonly
										required 
										class="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
									/>
								</div>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Dosen Wali</label>
								<select 
									name="advisorId"
									class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
								>
									<option value="">Pilih Dosen Wali (opsional)</option>
									{#each allAdvisors as advisor}
										<option value={advisor.id}>{advisor.fullName}</option>
									{/each}
								</select>
							</div>
						{/if}

						<div class="flex justify-end">
							<LoadingButton 
								type="submit"
								variant="primary"
								loading={registerLoading}
								loadingText="Mendaftarkan..."
							>
								Daftar {registerType === 'dosen' ? 'Dosen Wali' : 'Mahasiswa'}
							</LoadingButton>
						</div>
					</form>
				</div>
			{/if}
		{/if}
	</div>
</BaseModal>

<!-- Delete Confirmation Modal -->
<DeleteConfirmModal 
	bind:show={showDeleteConfirm}
	title="Konfirmasi Hapus Pengguna"
	message="Apakah Anda yakin ingin menghapus"
	itemName={userToDelete?.fullName || ''}
	warningItems={userToDelete ? getDeleteWarnings(userToDelete, deleteType) : []}
	actionUrl="?/deleteUser"
	hiddenFields={{ 
		userId: userToDelete?.id || '', 
		userType: deleteType 
	}}
	variant="danger"
	on:close={cancelDelete}
/>