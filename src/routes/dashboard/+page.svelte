<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import StudentDashboard from '../../components/dashboards/StudentDashboard.svelte';
	import AdvisorDashboard from '../../components/dashboards/AdvisorDashboard.svelte';
	import HeadDashboard from '../../components/dashboards/HeadDashboard.svelte';

	export let data: PageData;
	export let form: ActionData;

	$: user = data.userContext.user;
	$: userRole = user.role;

	function getRoleDisplayName(role: string): string {
		switch (role) {
			case 'Mahasiswa': return 'Mahasiswa';
			case 'Dosen_Wali': return 'Dosen Wali';
			case 'Kepala_Program_Studi': return 'Kepala Program Studi';
			default: return role;
		}
	}

	function getProgramDisplayName(program: string | null): string {
		if (!program) return '';
		switch (program) {
			case 'Teknik_Informatika': return 'Teknik Informatika';
			case 'Sistem_Teknologi_Informasi': return 'Sistem dan Teknologi Informasi';
			default: return program;
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Sistem Akademik X</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<header class="flex items-center justify-between border-b border-gray-200 py-6">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-gray-900">
					Sistem Akademik X
				</h1>
				<p class="mt-1 text-lg text-gray-600">
					Dashboard - {getRoleDisplayName(userRole)}
				</p>
				{#if user.programStudi}
					<p class="text-sm text-gray-500">
						{getProgramDisplayName(user.programStudi)}
					</p>
				{/if}
			</div>
			<div class="flex items-center gap-4">
				<span class="text-sm text-gray-600">
					{user.fullName}
				</span>
				<a 
					href="/api/auth/logout" 
					class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
				>
					Logout
				</a>
			</div>
		</header>

		<!-- Main Content -->
		<main class="py-8">
			<!-- Global Success/Error Messages -->
			{#if form && 'message' in form}
				<div class="rounded-md bg-green-100 p-4 text-sm text-green-700">
					{form.message}
				</div>
			{/if}
			{#if form && 'error' in form}
				<div class="rounded-md bg-red-100 p-4 text-sm text-red-700">
					{form.error}
				</div>
			{/if}

			{#if form?.error}
				<div class="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
					<div class="flex items-center">
						<svg class="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
						</svg>
						<span class="text-sm font-medium text-red-800">{form.error}</span>
					</div>
				</div>
			{/if}

			<!-- Role-specific Dashboard Components -->
			{#if userRole === 'Mahasiswa'}
				<StudentDashboard {data} {form} />
			{:else if userRole === 'Dosen_Wali'}
				<AdvisorDashboard {data} {form} />
			{:else if userRole === 'Kepala_Program_Studi'}
				<HeadDashboard {data} {form} />
			{:else}
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-xl font-semibold text-gray-900">Peran Tidak Dikenali</h2>
					<p class="mt-2 text-gray-600">
						Peran pengguna "{userRole}" tidak dikenali oleh sistem.
					</p>
				</div>
			{/if}
		</main>
	</div>
</div>