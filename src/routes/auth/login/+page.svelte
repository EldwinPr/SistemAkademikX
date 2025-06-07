<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { LoginResponse } from '$lib/types/auth.types';

	let username = '';
	let password = '';
	let loading = false;
	let error = '';
	let success = '';

	// Get redirect URL from query params
	$: redirectTo = $page.url.searchParams.get('redirect') || '/';

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
				// Redirect after successful login
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
	<title>Masuk - Sistem Transkrip Akademik</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Sistem Transkrip Akademik
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Masuk untuk mengakses akun Anda
			</p>
		</div>

		<form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
			<div class="space-y-4">
				<div>
					<label for="username" class="block text-sm font-medium text-gray-700">
						Nama Pengguna
					</label>
					<input
						id="username"
						name="username"
						type="text"
						required
						bind:value={username}
						on:keydown={handleKeydown}
						disabled={loading}
						class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Masukkan nama pengguna"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">
						Kata Sandi
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						bind:value={password}
						on:keydown={handleKeydown}
						disabled={loading}
						class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Masukkan kata sandi"
					/>
				</div>
			</div>

			{#if error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
			{/if}

			{#if success}
				<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
					{success} - Mengalihkan...
				</div>
			{/if}

			<div>
				<button
					type="submit"
					disabled={loading}
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if loading}
						<span class="flex items-center">
							<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Masuk...
						</span>
					{:else}
						Masuk
					{/if}
				</button>
			</div>
		</form>

		<!-- Test credentials info -->
		<div class="mt-8 bg-blue-50 border border-blue-200 p-4 rounded-md">
			<h3 class="text-sm font-medium text-blue-800 mb-2">Kredensial Test:</h3>
			<div class="text-xs text-blue-700 space-y-1">
				<p><strong>Kaprodi IF:</strong> KaprodiIF / admin123</p>
				<p><strong>Kaprodi STI:</strong> KaprodiSTI / admin123</p>
				<p><strong>Dosen Wali:</strong> advisor1 / admin123</p>
				<p><strong>Mahasiswa:</strong> student1 / admin123 (dev only)</p>
			</div>
		</div>
	</div>
</div>