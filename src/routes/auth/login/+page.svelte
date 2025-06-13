<!-- src/routes/auth/login/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { LoginResponse } from '$lib/types/auth.types';
	import { fade } from 'svelte/transition';

	let username = '';
	let password = '';
	let loading = false;
	let error = '';
	let success = '';

	// Test users from seed
	const testUsers = [
		{ username: 'KaprodiIF', password: 'admin123', role: 'Kaprodi IF' },
		{ username: 'KaprodiSTI', password: 'admin123', role: 'Kaprodi STI' },
		{ username: 'advisor1', password: 'admin123', role: 'Dosen Wali 1' },
		{ username: 'advisor2', password: 'admin123', role: 'Dosen Wali 2' },
		{ username: 'advisor3', password: 'admin123', role: 'Dosen Wali 3' },
		{ username: 'advisor4', password: 'admin123', role: 'Dosen Wali 4' },
		{ username: 'advisor5', password: 'admin123', role: 'Dosen Wali 5' },
		{ username: 'student1', password: 'admin123', role: 'Mahasiswa IF' },
		{ username: 'student2', password: 'admin123', role: 'Mahasiswa STI' }
	];

	$: redirectTo = $page.url.searchParams.get('redirect') || '/';

	function selectUser(user: any) {
		username = user.username;
		password = user.password;
	}

	async function handleLogin() {
		if (!username || !password) {
			error = 'Silakan masukkan nama pengguna dan kata sandi';
			return;
		}
		loading = true;
		error = '';
		success = '';
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username, password })
			});
			const result: LoginResponse = await response.json();
			if (result.success) {
				success = result.message;
				setTimeout(() => {
					goto(redirectTo);
				}, 1000);
			} else {
				error = result.message;
			}
		} catch (err) {
			error = 'Kesalahan jaringan. Silakan coba lagi.';
			console.error('Login error:', err);
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<svelte:head>
	<title>Masuk - Sistem Akademik X</title>
</svelte:head>

<div class="min-h-screen bg-white">
	<div class="flex min-h-screen">
		<div class="hidden md:flex md:w-1/2 items-center justify-center bg-indigo-600 p-12 text-white">
			<div class="max-w-md text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-20 h-20 mx-auto mb-4 text-indigo-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
				<h1 class="text-4xl font-bold tracking-tight">Sistem Akademik X</h1>
				<p class="mt-4 text-indigo-200">
					Mengamankan data transkrip akademik Anda dengan memanfaatkan Multi-Kriptografi untuk kerahasiaan dan integritas data yang terjamin.
				</p>
			</div>
		</div>

		<div class="flex flex-col justify-center w-full md:w-1/2 p-6 sm:p-12">
			<div class="w-full max-w-md mx-auto">
				<div>
					<h2 class="mt-6 text-center text-3xl font-bold text-gray-900">
						Selamat Datang
					</h2>
					<p class="mt-2 text-center text-sm text-gray-600">
						Masuk untuk mengakses akun Anda
					</p>
				</div>

				<!-- Quick Select Dropdown -->
				<div class="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
					<h3 class="text-sm font-medium text-blue-800 mb-2">Pilih Cepat (Test):</h3>
					<select 
						on:change={(e) => selectUser(testUsers[(e.target as HTMLSelectElement).selectedIndex - 1])}
						class="w-full text-sm border border-blue-300 rounded-md px-3 py-2 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
					>
						<option value="">-- Pilih pengguna test --</option>
						{#each testUsers as user}
							<option value={user.username}>{user.role} ({user.username})</option>
						{/each}
					</select>
				</div>

				<form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
					<div class="space-y-4 rounded-md">
						<div>
							<label for="username" class="sr-only">Nama Pengguna</label>
							<div class="relative">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
								</div>
								<input
									id="username"
									name="username"
									type="text"
									required
									bind:value={username}
									on:keydown={handleKeydown}
									disabled={loading}
									class="block w-full rounded-md border-gray-300 py-3 pl-10 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
									placeholder="Nama Pengguna"
								/>
							</div>
						</div>

						<div>
							<label for="password" class="sr-only">Kata Sandi</label>
                            <div class="relative">
                                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    bind:value={password}
                                    on:keydown={handleKeydown}
                                    disabled={loading}
                                    class="block w-full rounded-md border-gray-300 py-3 pl-10 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Kata Sandi"
                                />
                            </div>
						</div>
					</div>

					{#if error}
						<div transition:fade class="flex items-start rounded-md border border-red-200 bg-red-50 p-3">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
							<span class="text-sm text-red-700">{error}</span>
						</div>
					{/if}

					{#if success}
						<div transition:fade class="flex items-start rounded-md border border-green-200 bg-green-50 p-3">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
							<span class="text-sm text-green-700">{success}</span>
						</div>
					{/if}

					<div>
						<button
							type="submit"
							disabled={loading}
							class="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
						>
							{#if loading}
								<span class="flex items-center">
									<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
									Memproses...
								</span>
							{:else}
								Masuk
							{/if}
						</button>
					</div>
				</form>

				<div class="mt-8 rounded-lg bg-gray-100 p-4">
					<h3 class="text-sm font-medium text-gray-800 mb-2">Informasi Akun Uji Coba:</h3>
					<div class="text-xs text-gray-600 space-y-1">
						<p><strong>Kaprodi IF:</strong> KaprodiIF / admin123</p>
                        <p><strong>Kaprodi STI:</strong> KaprodiSTI / admin123</p>
						<p><strong>Dosen Wali:</strong> advisor1-5 / admin123</p>
						<p><strong>Mahasiswa:</strong> student1-2 / admin123</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>