<script lang="ts">
	export let data: any;
	
	$: user = data?.user?.user;
	$: permissions = data?.user?.permissions;

	function translateRole(role: string): string {
		switch (role) {
			case 'Mahasiswa': return 'Mahasiswa';
			case 'Dosen_Wali': return 'Dosen Wali';
			case 'Kepala_Program_Studi': return 'Kepala Program Studi';
			default: return role;
		}
	}

	function translateProgram(program: string): string {
		switch (program) {
			case 'Teknik_Informatika': return 'Teknik Informatika';
			case 'Sistem_Teknologi_Informasi': return 'Sistem dan Teknologi Informasi';
			default: return program;
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Sistem Transkrip Akademik</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center">
				<h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
				<form action="/api/auth/logout" method="POST">
					<button 
						type="submit"
						class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
					>
						Keluar
					</button>
				</form>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			
			<!-- Welcome Card -->
			<div class="bg-white shadow rounded-lg p-6 mb-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">
					Selamat datang, {user?.fullName || 'Pengguna'}!
				</h2>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p><strong>Peran:</strong> {translateRole(user?.role || '')}</p>
						<p><strong>Username:</strong> {user?.username}</p>
					</div>
					<div>
						{#if user?.nim}
							<p><strong>NIM:</strong> {user.nim}</p>
						{/if}
						{#if user?.programStudi}
							<p><strong>Program:</strong> {translateProgram(user.programStudi)}</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="bg-white shadow rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Menu</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					
					{#if permissions?.canViewOwnTranscript}
						<a href="/academic/my-transcript" 
						   class="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
							<h4 class="font-medium">Lihat Transkrip</h4>
							<p class="text-sm text-gray-600">Akses transkrip nilai Anda</p>
						</a>
					{/if}

					{#if permissions?.canCreateRecords}
						<a href="/academic/create" 
						   class="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
							<h4 class="font-medium">Buat Record</h4>
							<p class="text-sm text-gray-600">Input data akademik mahasiswa</p>
						</a>
					{/if}

					{#if permissions?.canViewAdviseeTranscripts}
						<a href="/academic/advisees" 
						   class="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
							<h4 class="font-medium">Mahasiswa Bimbingan</h4>
							<p class="text-sm text-gray-600">Lihat data mahasiswa bimbingan</p>
						</a>
					{/if}

					{#if permissions?.canViewAllTranscripts}
						<a href="/academic/all" 
						   class="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
							<h4 class="font-medium">Semua Transkrip</h4>
							<p class="text-sm text-gray-600">Kelola semua data akademik</p>
						</a>
					{/if}

					{#if permissions?.canManageKeys}
						<a href="/admin/keys" 
						   class="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
							<h4 class="font-medium">Kelola Kunci</h4>
							<p class="text-sm text-gray-600">Administrasi kunci enkripsi</p>
						</a>
					{/if}

					<!-- Test Crypto Functions -->
					<a href="/test/crypto" 
					   class="p-4 border rounded-lg hover:bg-gray-50 transition-colors border-dashed">
						<h4 class="font-medium text-blue-600">Test Crypto</h4>
						<p class="text-sm text-gray-600">Test kriptografi functions</p>
					</a>
				</div>
			</div>

		</div>
	</main>
</div>