<script lang="ts">
	export let title: string;
	export let description: string;
	export let actionText: string = 'Take Action';
	export let color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo' | 'gray' = 'blue';
	export let disabled = false;
	export let loading = false;
	export let icon: string = ''; // Optional icon (you can pass HTML or emoji)
	
	// Color classes for different themes
	const colorClasses = {
		blue: {
			bg: 'bg-blue-50',
			text: 'text-blue-900',
			desc: 'text-blue-800', 
			action: 'text-blue-600 hover:text-blue-800'
		},
		green: {
			bg: 'bg-green-50',
			text: 'text-green-900',
			desc: 'text-green-800',
			action: 'text-green-600 hover:text-green-800'
		},
		red: {
			bg: 'bg-red-50', 
			text: 'text-red-900',
			desc: 'text-red-800',
			action: 'text-red-600 hover:text-red-800'
		},
		yellow: {
			bg: 'bg-yellow-50',
			text: 'text-yellow-900', 
			desc: 'text-yellow-800',
			action: 'text-yellow-600 hover:text-yellow-800'
		},
		purple: {
			bg: 'bg-purple-50',
			text: 'text-purple-900',
			desc: 'text-purple-800', 
			action: 'text-purple-600 hover:text-purple-800'
		},
		indigo: {
			bg: 'bg-indigo-50',
			text: 'text-indigo-900',
			desc: 'text-indigo-800',
			action: 'text-indigo-600 hover:text-indigo-800'  
		},
		gray: {
			bg: 'bg-gray-50',
			text: 'text-gray-900',
			desc: 'text-gray-800',
			action: 'text-gray-600 hover:text-gray-800'
		}
	};
	
	$: currentColors = colorClasses[color];
</script>

<div class="overflow-hidden rounded-lg {currentColors.bg} p-5 shadow transition-shadow hover:shadow-md">
	<!-- Header with optional icon -->
	<div class="flex items-start gap-3 mb-2">
		{#if icon}
			<div class="text-xl {currentColors.text}" aria-hidden="true">
				{@html icon}
			</div>
		{/if}
		<div class="flex-1">
			<h4 class="text-lg font-medium {currentColors.text}">
				{title}
			</h4>
		</div>
	</div>
	
	<!-- Description -->
	<p class="mt-1 text-sm {currentColors.desc} leading-relaxed">
		{description}
	</p>
	
	<!-- Action Button/Link -->
	<div class="mt-4">
		<button 
			type="button"
			{disabled}
			class="font-semibold {currentColors.action} disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			on:click
		>
			{#if loading}
				<span class="inline-flex items-center gap-2">
					<svg class="animate-spin h-3 w-3" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Loading...
				</span>
			{:else}
				{actionText} &rarr;
			{/if}
		</button>
	</div>
</div>