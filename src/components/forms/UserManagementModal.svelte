<script lang="ts">
	export let showModal = false;
	export let allAdvisors: any[] = [];
	export let allStudents: any[] = [];

	let activeTab = 'advisors'; // 'advisors', 'students', 'register'
	let registerType = 'dosen'; // 'dosen', 'student'

	// Auto NIM generation
	let selectedProgram = 'Teknik_Informatika'; // For new students
	let entryYear = new Date().getFullYear(); // Current year
	let generatedNIM = '';

	// Confirmation states
	let showDeleteConfirm = false;
	let userToDelete: any = null;
	let deleteType = ''; // 'advisor' or 'student'

	// Generate NIM when program or year changes
	$: if (registerType === 'student') {
		generateNIM();
	}

	// Get students for each advisor
	$: advisorsWithStudents = allAdvisors.map(advisor => ({
		...advisor,
		students: allStudents.filter(student => student.DosenId === advisor.id)
	}));

	// Get user's program studi for NIM generation (passed from parent component)
	export let currentUserProgram: string = 'Teknik_Informatika'; // This should be passed from HeadDashboard

	function closeModal() {
		showModal = false;
		activeTab = 'advisors';
		registerType = 'dosen';
		resetDeleteState();
	}

	function setActiveTab(tab: string) {
		activeTab = tab;
		resetDeleteState();
	}

	function resetDeleteState() {
		showDeleteConfirm = false;
		userToDelete = null;
		deleteType = '';
	}

	function generateNIM() {
		if (registerType !== 'student') return;
		
		// Use current user's program for NIM generation
		const programCode = currentUserProgram === 'Teknik_Informatika' ? '135' : '182';
		
		// Get last 2 digits of entry year
		const yearSuffix = entryYear.toString().slice(-2);
		
		// Find existing students with same program and year to get next number
		const samePattern = allStudents.filter(student => 
			student.nim?.startsWith(programCode + yearSuffix)
		);
		
		// Get the next available number (001, 002, etc.)
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
</script>

{#if showModal}
	<!-- Delete Confirmation Modal -->
	{#if showDeleteConfirm}
		<div class="fixed inset-0 z-60 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75"></div>
				<div class="relative bg-white rounded-lg shadow-xl w-full max-w-md">
					<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
						<h3 class="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h3>
					</div>
					<div class="p-6">
						<p class="text-sm text-gray-600 mb-4">
							Apakah Anda yakin ingin menghapus {deleteType === 'advisor' ? 'dosen wali' : 'mahasiswa'} 
							<strong>{userToDelete?.fullName}</strong>?
						</p>
						{#if deleteType === 'advisor' && userToDelete?.students?.length > 0}
							<div class="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
								<p class="text-sm text-yellow-800">
									⚠️ Dosen ini memiliki {userToDelete.students.length} mahasiswa bimbingan. 
									Hubungan bimbingan akan dihapus.
								</p>
							</div>
						{/if}
						<div class="flex gap-3 justify-end">
							<button 
								type="button"
								on:click={cancelDelete}
								class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
							>
								Batal
							</button>
							<form method="POST" action="?/deleteUser" class="inline">
								<input type="hidden" name="userId" value={userToDelete?.id} />
								<input type="hidden" name="userType" value={deleteType} />
								<button 
									type="submit"
									class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
								>
									Ya, Hapus
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Modal -->
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-screen items-center justify-center p-4">
			<!-- Backdrop overlay -->
			<div 
				class="fixed inset-0 bg-gray-500 bg-opacity-75"
				on:click={closeModal}
			></div>

			<!-- Modal panel -->
			<div class="relative bg-white rounded-lg shadow-xl w-full max-w-6xl">
				
				<!-- Modal header -->
				<div class="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
					<div class="flex items-center justify-between">
						<h3 class="text-xl font-semibold text-gray-900">
							Manajemen Pengguna
						</h3>
						<button
							type="button"
							class="text-gray-400 hover:text-gray-600"
							on:click={closeModal}
						>
							<span class="text-2xl">&times;</span>
						</button>
					</div>
				</div>

				<!-- Tab Navigation -->
				<div class="border-b border-gray-200">
					<nav class="flex px-6">
						<button
							type="button"
							class="py-4 px-6 text-sm font-medium border-b-2 transition-colors"
							class:border-indigo-500={activeTab === 'advisors'}
							class:text-indigo-600={activeTab === 'advisors'}
							class:border-transparent={activeTab !== 'advisors'}
							class:text-gray-500={activeTab !== 'advisors'}
							on:click={() => setActiveTab('advisors')}
						>
							Dosen Wali
						</button>
						<button
							type="button"
							class="py-4 px-6 text-sm font-medium border-b-2 transition-colors"
							class:border-indigo-500={activeTab === 'students'}
							class:text-indigo-600={activeTab === 'students'}
							class:border-transparent={activeTab !== 'students'}
							class:text-gray-500={activeTab !== 'students'}
							on:click={() => setActiveTab('students')}
						>
							Mahasiswa
						</button>
						<button
							type="button"
							class="py-4 px-6 text-sm font-medium border-b-2 transition-colors"
							class:border-indigo-500={activeTab === 'register'}
							class:text-indigo-600={activeTab === 'register'}
							class:border-transparent={activeTab !== 'register'}
							class:text-gray-500={activeTab !== 'register'}
							on:click={() => setActiveTab('register')}
						>
							Daftar Baru
						</button>
					</nav>
				</div>

				<!-- Modal content -->
				<div class="p-6 max-h-96 overflow-y-auto">
					
					<!-- Advisors Tab -->
					{#if activeTab === 'advisors'}
						<div>
							<h4 class="text-lg font-medium text-gray-900 mb-4">Daftar Dosen Wali</h4>
							<div class="overflow-x-auto">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahasiswa Bimbingan</th>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
										</tr>
									</thead>
									<tbody class="bg-white divide-y divide-gray-200">
										{#each advisorsWithStudents as advisor}
											<tr>
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
												<td class="px-4 py-3 text-sm space-x-2">
													<button class="text-indigo-600 hover:text-indigo-900 text-sm">
														Edit
													</button>
													<button 
														type="button"
														on:click={() => confirmDelete(advisor, 'advisor')}
														class="text-red-600 hover:text-red-900 text-sm"
													>
														Hapus
													</button>
												</td>
											</tr>
										{:else}
											<tr>
												<td colspan="4" class="px-4 py-3 text-sm text-gray-500 text-center">
													Belum ada data dosen wali
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}

					<!-- Students Tab -->
					{#if activeTab === 'students'}
						<div>
							<h4 class="text-lg font-medium text-gray-900 mb-4">Daftar Mahasiswa</h4>
							<div class="overflow-x-auto">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIM</th>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosen Wali</th>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
										</tr>
									</thead>
									<tbody class="bg-white divide-y divide-gray-200">
										{#each allStudents as student}
											<tr>
												<td class="px-4 py-3 text-sm text-gray-900">{student.fullName}</td>
												<td class="px-4 py-3 text-sm text-gray-500">{student.nim}</td>
												<td class="px-4 py-3 text-sm text-gray-500">
													<form method="POST" action="?/assignAdvisor" class="flex items-center gap-2">
														<input type="hidden" name="studentId" value={student.id} />
														<select 
															name="advisorId" 
															class="text-xs rounded border-gray-300 flex-1"
															value={student.DosenId || ''}
														>
															<option value="">Pilih Dosen Wali</option>
															{#each allAdvisors as advisor}
																<option value={advisor.id} selected={student.DosenId === advisor.id}>
																	{advisor.fullName}
																</option>
															{/each}
														</select>
														<button type="submit" class="text-indigo-600 hover:text-indigo-900 text-xs px-2 py-1 border rounded">
															Update
														</button>
													</form>
												</td>
												<td class="px-4 py-3 text-sm">
													<button 
														type="button"
														on:click={() => confirmDelete(student, 'student')}
														class="text-red-600 hover:text-red-900 text-sm"
													>
														Hapus
													</button>
												</td>
											</tr>
										{:else}
											<tr>
												<td colspan="4" class="px-4 py-3 text-sm text-gray-500 text-center">
													Belum ada data mahasiswa
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}

					<!-- Register Tab -->
					{#if activeTab === 'register'}
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
							<form method="POST" action="?/registerUser" class="space-y-4">
								<!-- Hidden fields for proper form submission -->
								<input type="hidden" name="userType" value={registerType} />
								{#if registerType === 'dosen'}
									<input type="hidden" name="role" value="Dosen_Wali" />
								{:else}
									<input type="hidden" name="role" value="Mahasiswa" />
								{/if}
								
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label class="block text-sm font-medium text-gray-700">Username</label>
										<input 
											type="text" 
											name="username" 
											required 
											class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
											placeholder="Username unik"
										/>
									</div>
									<div>
										<label class="block text-sm font-medium text-gray-700">Password</label>
										<input 
											type="password" 
											name="password" 
											required 
											class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
											placeholder="Password"
										/>
									</div>
								</div>

								<div>
									<label class="block text-sm font-medium text-gray-700">Nama Lengkap</label>
									<input 
										type="text" 
										name="fullName" 
										required 
										class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
											<label class="block text-sm font-medium text-gray-700">Tahun Masuk</label>
											<input 
												type="number" 
												bind:value={entryYear}
												min="2000"
												max="2030"
												class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
											/>
										</div>
										<div>
											<label class="block text-sm font-medium text-gray-700">NIM (Auto-generated)</label>
											<input 
												type="text" 
												name="nim" 
												value={generatedNIM}
												readonly
												required 
												class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
											/>
										</div>
									</div>
									<div>
										<label class="block text-sm font-medium text-gray-700">Dosen Wali</label>
										<select 
											name="advisorId"
											class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
										>
											<option value="">Pilih Dosen Wali (opsional)</option>
											{#each allAdvisors as advisor}
												<option value={advisor.id}>{advisor.fullName}</option>
											{/each}
										</select>
									</div>
								{/if}

								<div class="flex justify-end">
									<button 
										type="submit" 
										class="rounded-md bg-indigo-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
									>
										Daftar {registerType === 'dosen' ? 'Dosen Wali' : 'Mahasiswa'}
									</button>
								</div>
							</form>
						</div>
					{/if}

				</div>
			</div>
		</div>
	</div>
{/if}