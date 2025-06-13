<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { VerificationStatus } from '$lib/types/academic.types';
	import TranscriptInputForm from '../../components/TranscriptInputForm.svelte';

	export let data: PageData;
	export let form: ActionData;

	// State management for different views
	let showInputForm = false;
	let showGroupDecryptForm = false;
	let showAllTranscriptsView = false;
	let showSigningView = false;
	let showPdfView = false;

	// Data from page load
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

	// Close input form when form submission is successful
	$: if (form && 'success' in form && form.success) {
		showInputForm = false;
	}
</script>

<svelte:head>
	<title>Dashboard - Sistem Akademik X</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<header class="flex items-center justify-between border-b border-gray-200 pb-6">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-gray-900">Sistem Akademik X</h1>
				<p class="mt-1 text-lg text-gray-600">Dashboard</p>
			</div>
			<a 
				href="/api/auth/logout" 
				class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
			>
				Logout
			</a>
		</header>

		<main class="mt-8">
			<!-- Success/Error Messages -->
			{#if form?.message}
				<div class="mb-4 rounded-md bg-green-100 p-4 text-sm text-green-700">
					{form.message}
				</div>
			{/if}
			{#if form?.error}
				<div class="mb-4 rounded-md bg-red-100 p-4 text-sm text-red-700">
					{form.error}
				</div>
			{/if}

			<!-- Transcript Input Form Component -->
			<TranscriptInputForm 
				{students}
				bind:showForm={showInputForm}
			/>

			<!-- Main Dashboard Content -->
			<div class="bg-white p-6 shadow-lg sm:rounded-lg sm:p-8">
				<div class="mb-6">
					<h2 class="text-2xl font-semibold leading-7 text-gray-800">
						Selamat Datang, {user.fullName}!
					</h2>
					<p class="mt-2 text-base text-gray-600">
						Anda masuk sebagai: 
						<span class="font-bold text-indigo-700">{translateRole(user.role)}</span>
					</p>
				</div>

				<div>
					<h3 class="text-xl font-semibold leading-6 text-gray-800">Menu Akses Anda</h3>
					<div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						
						<!-- Student Menu -->
						{#if user.role === 'Mahasiswa'}
							<div class="overflow-hidden rounded-lg bg-indigo-50 p-5 shadow">
								<h4 class="truncate text-lg font-medium text-indigo-900">Lihat Transkrip</h4>
								<p class="mt-1 text-sm text-indigo-800">Akses data transkrip akademik Anda.</p>
								<form method="POST" action="?/viewMyTranscript" class="inline">
									<button type="submit" class="mt-4 font-semibold text-indigo-600 hover:text-indigo-800">
										Buka Transkrip &rarr;
									</button>
								</form>
							</div>
						{/if}

						<!-- Advisor Menu -->
						{#if user.role === 'Dosen_Wali'}
							<div class="overflow-hidden rounded-lg bg-blue-50 p-5 shadow">
								<h4 class="truncate text-lg font-medium text-blue-900">Input Data Mahasiswa</h4>
								<p class="mt-1 text-sm text-blue-800">Masukkan data nilai mahasiswa.</p>
								<button 
									type="button" 
									on:click={() => (showInputForm = true)} 
									class="mt-4 inline-block font-semibold text-blue-600 hover:text-blue-800"
								>
									Mulai Input &rarr;
								</button>
							</div>

							<div class="overflow-hidden rounded-lg bg-yellow-50 p-5 shadow">
								<h4 class="truncate text-lg font-medium text-yellow-900">Dekripsi Grup</h4>
								<p class="mt-1 text-sm text-yellow-800">Buka data transkrip bersama.</p>
								<button 
									type="button" 
									on:click={() => (showGroupDecryptForm = true)} 
									class="mt-4 inline-block font-semibold text-yellow-600 hover:text-yellow-800"
								>
									Mulai Proses &rarr;
								</button>
							</div>
						{/if}

						<!-- Head Menu -->
						{#if user.role === 'Kepala_Program_Studi'}
							<div class="overflow-hidden rounded-lg bg-purple-50 p-5 shadow">
								<h4 class="truncate text-lg font-medium text-purple-900">Lihat Semua Data</h4>
								<p class="mt-1 text-sm text-purple-800">Akses seluruh transkrip prodi.</p>
								<button 
									type="button" 
									on:click={() => (showAllTranscriptsView = true)} 
									class="mt-4 inline-block font-semibold text-purple-600 hover:text-purple-800"
								>
									Akses Data &rarr;
								</button>
							</div>

							<div class="overflow-hidden rounded-lg bg-red-50 p-5 shadow">
								<h4 class="truncate text-lg font-medium text-red-900">Tanda Tangan Digital</h4>
								<p class="mt-1 text-sm text-red-800">Tanda tangani data akademik.</p>
								<button 
									type="button" 
									on:click={() => (showSigningView = true)} 
									class="mt-4 inline-block font-semibold text-red-600 hover:text-red-800"
								>
									Buka Menu &rarr;
								</button>
							</div>
						{/if}
					</div>

					<!-- General Actions -->
					<div class="mt-6 border-t pt-6">
						<h3 class="text-lg font-semibold leading-6 text-gray-800">Aksi Umum</h3>
						<div class="mt-4">
							<button 
								type="button" 
								on:click={() => showPdfView = true} 
								class="rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-800 shadow-sm hover:bg-green-100"
							>
								Cetak Transkrip ke PDF
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Other modals/forms would go here -->
			<!-- You can create similar components for Group Decrypt, PDF View, etc. -->
		</main>
	</div>
</div>